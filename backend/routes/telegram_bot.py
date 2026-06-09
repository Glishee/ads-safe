from flask import Blueprint, request, jsonify
from models.channel_model import channels_collection
from models.user_model import users_collection
from bson import ObjectId
import os
import re
import requests
from datetime import datetime

bot_bp = Blueprint("telegram_bot", __name__)

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
API = f"https://api.telegram.org/bot{TOKEN}"

CATEGORIES = [
    "tech", "business", "entertainment", "news", "lifestyle",
    "education", "crypto", "gaming", "travel", "finance", "health", "sports", "other",
]
CATEGORY_LABEL = {
    "tech": "Tech", "business": "Business", "entertainment": "Entertainment",
    "news": "News", "lifestyle": "Lifestyle", "education": "Education",
    "crypto": "Crypto", "gaming": "Gaming", "travel": "Travel",
    "finance": "Finance", "health": "Health", "sports": "Sports", "other": "Other",
}
LABEL_TO_CAT = {v.lower(): k for k, v in CATEGORY_LABEL.items()}
LABEL_TO_CAT.update({k: k for k in CATEGORIES})

# Per-chat conversation state stored in memory.
# On Railway free tier the process restarts occasionally — acceptable for this flow.
_sessions: dict = {}

_CATEGORY_KEYBOARD = {
    "keyboard": [
        [{"text": "Tech"}, {"text": "Business"}, {"text": "Crypto"}],
        [{"text": "News"}, {"text": "Entertainment"}, {"text": "Gaming"}],
        [{"text": "Education"}, {"text": "Finance"}, {"text": "Lifestyle"}],
        [{"text": "Health"}, {"text": "Sports"}, {"text": "Other"}],
    ],
    "resize_keyboard": True,
    "one_time_keyboard": True,
}
_REMOVE_KEYBOARD = {"remove_keyboard": True}


def _send(chat_id, text, reply_markup=None):
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    try:
        requests.post(f"{API}/sendMessage", json=payload, timeout=10)
    except Exception as e:
        print(f"[Bot] send error: {e}")


def _fetch_channel(link: str):
    match = re.search(r"(?:t\.me|telegram\.me)/([a-zA-Z0-9_]+)", link)
    if not match:
        return None, "Invalid Telegram link format"
    username = "@" + match.group(1)

    chat_r = requests.get(f"{API}/getChat", params={"chat_id": username}, timeout=15).json()
    if not chat_r.get("ok"):
        return None, chat_r.get("description", "Channel not found — make sure the bot is added to the channel")

    chat = chat_r["result"]
    count_r = requests.get(f"{API}/getChatMemberCount", params={"chat_id": username}, timeout=10).json()
    members = count_r.get("result", 0) if count_r.get("ok") else 0

    avatar_url = None
    photo = chat.get("photo")
    if photo:
        fid = photo.get("big_file_id")
        fr = requests.get(f"{API}/getFile", params={"file_id": fid}, timeout=10).json()
        if fr.get("ok"):
            avatar_url = f"https://api.telegram.org/file/bot{TOKEN}/{fr['result']['file_path']}"

    return {
        "name": chat.get("title", ""),
        "description": chat.get("description", "") or "",
        "subscribers_count": members,
        "avatar_url": avatar_url,
        "telegram_link": link,
    }, None


@bot_bp.route("/bot-info", methods=["GET"])
def bot_info():
    """Returns the bot username so the frontend can build deep links."""
    if not TOKEN:
        return jsonify({"error": "Bot token not configured"}), 503
    try:
        r = requests.get(f"{API}/getMe", timeout=10).json()
        if r.get("ok"):
            return jsonify({"bot_username": r["result"]["username"]}), 200
        return jsonify({"error": "Could not fetch bot info"}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 502


@bot_bp.route("/telegram/bot", methods=["POST"])
def webhook():
    data = request.get_json(silent=True) or {}
    msg = data.get("message") or data.get("edited_message")
    if not msg:
        return jsonify({"ok": True})

    chat_id = str(msg.get("chat", {}).get("id", ""))
    text = (msg.get("text") or "").strip()
    tg_from = msg.get("from", {})

    if not chat_id or not text:
        return jsonify({"ok": True})

    sess = _sessions.get(chat_id, {})
    state = sess.get("state", "idle")

    # /start [web_user_id] ─────────────────────────────────────────────────────
    if text.startswith("/start"):
        parts = text.split(None, 1)
        web_user_id = parts[1].strip() if len(parts) > 1 else None

        if not web_user_id:
            _send(chat_id,
                "👋 Welcome to <b>TeleAds</b>!\n\n"
                "To add your channel, open the TeleAds website and click "
                "<b>Add Channel via Telegram Bot</b>."
            )
            return jsonify({"ok": True})

        try:
            user = users_collection.find_one({"_id": ObjectId(web_user_id)})
        except Exception:
            user = None

        if not user:
            _send(chat_id, "❌ Invalid or expired link. Please try again from the website.")
            return jsonify({"ok": True})

        _sessions[chat_id] = {
            "state": "awaiting_link",
            "web_user_id": web_user_id,
            "email": user.get("email", ""),
            "username": user.get("username", ""),
        }
        _send(chat_id,
            f"👋 Hello, <b>{tg_from.get('first_name', 'there')}</b>!\n\n"
            "Send me the link to your Telegram channel.\n"
            "Example: <code>https://t.me/yourchannel</code>"
        )
        return jsonify({"ok": True})

    # awaiting_link ─────────────────────────────────────────────────────────────
    if state == "awaiting_link":
        if "t.me/" not in text and "telegram.me/" not in text:
            _send(chat_id,
                "Please send a valid Telegram channel link.\n"
                "Example: <code>https://t.me/yourchannel</code>"
            )
            return jsonify({"ok": True})

        _send(chat_id, "🔍 Fetching channel info...")
        info, err = _fetch_channel(text)
        if err:
            _send(chat_id, f"❌ {err}\n\nPlease check the link and try again.")
            return jsonify({"ok": True})

        _sessions[chat_id] = {**sess, "state": "awaiting_price", "channel": info}
        _send(chat_id,
            f"✅ <b>Channel found!</b>\n\n"
            f"📛 <b>Name:</b> {info['name']}\n"
            f"👥 <b>Subscribers:</b> {info['subscribers_count']:,}\n"
            f"📝 <b>Description:</b> {info['description'][:120] or '—'}\n\n"
            f"💰 What is your <b>price per post</b> (USD)?\n"
            f"Example: <code>25.50</code>"
        )
        return jsonify({"ok": True})

    # awaiting_price ────────────────────────────────────────────────────────────
    if state == "awaiting_price":
        try:
            price = float(text.replace("$", "").replace(",", "."))
            if price <= 0:
                raise ValueError()
        except ValueError:
            _send(chat_id, "Please enter a valid price greater than 0 (e.g., 25.50)")
            return jsonify({"ok": True})

        _sessions[chat_id] = {
            **sess,
            "state": "awaiting_category",
            "channel": {**sess["channel"], "price": price},
        }
        _send(chat_id,
            f"💰 Price set: <b>${price:.2f}/post</b>\n\n"
            "📂 Choose your channel category:",
            reply_markup=_CATEGORY_KEYBOARD,
        )
        return jsonify({"ok": True})

    # awaiting_category ─────────────────────────────────────────────────────────
    if state == "awaiting_category":
        cat = LABEL_TO_CAT.get(text.lower())
        if not cat:
            _send(chat_id,
                "Please choose a category from the keyboard below.",
                reply_markup=_CATEGORY_KEYBOARD,
            )
            return jsonify({"ok": True})

        channel = sess["channel"]
        web_user_id = sess.get("web_user_id")

        if not web_user_id:
            _send(chat_id,
                "❌ Session expired. Please restart from the TeleAds website.",
                reply_markup=_REMOVE_KEYBOARD,
            )
            _sessions.pop(chat_id, None)
            return jsonify({"ok": True})

        try:
            user = users_collection.find_one({"_id": ObjectId(web_user_id)})
            channels_collection.insert_one({
                "name": channel["name"],
                "description": channel["description"],
                "telegram_link": channel["telegram_link"],
                "avatar_url": channel.get("avatar_url") or (
                    f"https://ui-avatars.com/api/?name={channel['name']}"
                    "&background=0D8ABC&color=fff&size=128"
                ),
                "subscribers_count": channel["subscribers_count"],
                "category": cat,
                "post_price": channel["price"],
                "admin_username": (user.get("username", "") if user else ""),
                "admin_contact_email": (user.get("email", "") if user else ""),
                "owner_id": web_user_id,
                "is_approved": False,
                "is_rejected": False,
                "created_at": datetime.utcnow(),
                "added_via": "telegram_bot",
            })

            _send(chat_id,
                f"🎉 <b>Submitted for review!</b>\n\n"
                f"📛 {channel['name']}\n"
                f"👥 {channel['subscribers_count']:,} subscribers\n"
                f"💰 ${channel['price']:.2f}/post\n"
                f"📂 {CATEGORY_LABEL[cat]}\n\n"
                "An admin will review your channel shortly.\n"
                "Check the status on the <b>TeleAds</b> website.",
                reply_markup=_REMOVE_KEYBOARD,
            )
        except Exception as e:
            print(f"[Bot] DB error: {e}")
            _send(chat_id,
                "❌ Failed to save your channel. Please try again.",
                reply_markup=_REMOVE_KEYBOARD,
            )

        _sessions.pop(chat_id, None)
        return jsonify({"ok": True})

    # fallback ──────────────────────────────────────────────────────────────────
    _send(chat_id,
        "To add your channel, please open the TeleAds website and click "
        "<b>Add Channel via Telegram Bot</b>."
    )
    return jsonify({"ok": True})
