from flask import Blueprint, request, jsonify
import os
import re
import requests
import cloudinary
import cloudinary.uploader
from middleware.auth import require_auth

telegram_bp = Blueprint('telegram_api', __name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

_cloudinary_configured = False

def _configure_cloudinary():
    global _cloudinary_configured
    if not _cloudinary_configured:
        cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
        api_key    = os.environ.get("CLOUDINARY_API_KEY")
        api_secret = os.environ.get("CLOUDINARY_API_SECRET")
        if cloud_name and api_key and api_secret:
            cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)
            _cloudinary_configured = True
    return _cloudinary_configured


def _persist_telegram_avatar(temp_url: str) -> str:
    """
    Telegram file URLs are temporary — they expire in a few hours.
    Download the image and re-upload to Cloudinary so we get a permanent URL.
    Returns the permanent URL, or the original temp URL as a fallback.
    """
    try:
        resp = requests.get(temp_url, timeout=10)
        resp.raise_for_status()
        if _configure_cloudinary():
            result = cloudinary.uploader.upload(
                resp.content,
                folder="ads-safe/avatars",
                resource_type="image",
            )
            return result["secure_url"]
    except Exception:
        pass
    # Cloudinary not configured or upload failed — return temp URL as fallback
    return temp_url


@telegram_bp.route('/get_channel_info', methods=['POST', 'OPTIONS'])
@require_auth
def get_channel_info():
    data = request.get_json()
    link = data.get("link", "").strip()

    match = re.search(r"(t\.me|telegram\.me)/([a-zA-Z0-9_]+)", link)
    if not match:
        return jsonify({"error": "Invalid Telegram link"}), 400

    username = "@" + match.group(2)

    if not TELEGRAM_BOT_TOKEN:
        return jsonify({"error": "TELEGRAM_BOT_TOKEN not set in Railway"}), 500

    base = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

    chat_res = requests.get(f"{base}/getChat", params={"chat_id": username}).json()
    if not chat_res.get("ok"):
        return jsonify({"error": chat_res.get("description", "Channel not found")}), 404

    chat = chat_res["result"]

    count_res = requests.get(f"{base}/getChatMemberCount", params={"chat_id": username}).json()
    members = count_res.get("result", 0) if count_res.get("ok") else 0

    avatar_url = None
    photo = chat.get("photo")
    if photo:
        file_id = photo.get("big_file_id")
        file_res = requests.get(f"{base}/getFile", params={"file_id": file_id}).json()
        if file_res.get("ok"):
            file_path = file_res["result"]["file_path"]
            temp_url = f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}"
            # Persist to Cloudinary so the URL never expires
            avatar_url = _persist_telegram_avatar(temp_url)

    return jsonify({
        "name": chat.get("title", ""),
        "description": chat.get("description", "") or "",
        "subscribers_count": members,
        "avatar_url": avatar_url
    })
