from flask import Blueprint, request, jsonify
import os
import re
import requests

telegram_bp = Blueprint('telegram_api', __name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

@telegram_bp.route('/get_channel_info', methods=['POST', 'OPTIONS'])
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
            avatar_url = f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}"

    return jsonify({
        "name": chat.get("title", ""),
        "description": chat.get("description", "") or "",
        "subscribers_count": members,
        "avatar_url": avatar_url
    })
