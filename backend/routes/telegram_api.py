from flask import Blueprint, request, jsonify
from telethon import TelegramClient
from telethon.errors import UsernameNotOccupiedError
import os
import re
import asyncio

telegram_bp = Blueprint('telegram_api', __name__)

API_ID = int(os.getenv("TELEGRAM_API_ID", "0"))
API_HASH = os.getenv("TELEGRAM_API_HASH", "")

@telegram_bp.route('/get_channel_info', methods=['POST', 'OPTIONS'])
def get_channel_info():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response, 204

    try:
        data = request.get_json()
        link = data.get("link", "").strip()
        match = re.search(r"(t\.me|telegram\.me)/([a-zA-Z0-9_]+)", link)
        if not match:
            return jsonify({"error": "Invalid Telegram link"}), 400

        username = match.group(2)
        result = asyncio.run(fetch_channel_info(username))
        return jsonify(result)

    except UsernameNotOccupiedError:
        return jsonify({"error": "Channel not found"}), 404
    except Exception as e:
        print("Telegram API error:", str(e))
        return jsonify({"error": f"Server error: {str(e)}"}), 500



async def fetch_channel_info(username):
    client = TelegramClient("telegram_session", API_ID, API_HASH)
    await client.connect()

    try:
        entity = await client.get_entity(username)
        return {
            "name": getattr(entity, "title", ""),
            "description": getattr(entity, "about", ""),
            "subscribers_count": getattr(entity, "participants_count", 0),
            "avatar_url": None  # позже добавим аватар
        }
    finally:
        await client.disconnect()
