import secrets
import string
import re
from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from models.channel_model import channels_collection
from models.verification_token_model import (
    create_verification_token,
    get_active_token,
    mark_token_used,
)
from middleware.auth import require_auth
import os

verification_bp = Blueprint("verification", __name__)
TOKEN_ALPHABET = string.ascii_uppercase + string.digits
API_ID = int(os.getenv("TELEGRAM_API_ID", "0"))
API_HASH = os.getenv("TELEGRAM_API_HASH", "")


def _generate_token(length: int = 8) -> str:
    return "".join(secrets.choice(TOKEN_ALPHABET) for _ in range(length))


@verification_bp.route("/channels/<channel_id>/request-verification", methods=["POST"])
@require_auth
def request_verification(channel_id):
    user_id = session.get("user_id")
    try:
        channel = channels_collection.find_one({"_id": ObjectId(channel_id)})
        if not channel:
            return jsonify({"error": "Channel not found"}), 404
        if str(channel.get("owner_id")) != user_id:
            return jsonify({"error": "You are not the owner of this channel"}), 403

        existing = get_active_token(channel_id)
        if existing:
            return jsonify({
                "token": existing["token"],
                "message": "Post this code in your channel, then call confirm-verification",
                "expires_at": existing["expires_at"].isoformat(),
            }), 200

        token = _generate_token(8)
        doc = create_verification_token(channel_id, user_id, token)
        return jsonify({
            "token": token,
            "message": f"Post '{token}' in your Telegram channel, then call confirm-verification within 1 hour",
            "expires_at": doc["expires_at"].isoformat(),
        }), 200
    except Exception:
        return jsonify({"error": "Failed to generate verification token"}), 500


async def _check_channel_for_token(username: str, token: str) -> bool:
    from telethon import TelegramClient
    client = TelegramClient("telegram_session", API_ID, API_HASH)
    await client.connect()
    try:
        entity = await client.get_entity(username)
        messages = await client.get_messages(entity, limit=50)
        return any(msg.text and token in msg.text for msg in messages)
    finally:
        await client.disconnect()


@verification_bp.route("/channels/<channel_id>/confirm-verification", methods=["POST"])
@require_auth
def confirm_verification(channel_id):
    user_id = session.get("user_id")
    try:
        channel = channels_collection.find_one({"_id": ObjectId(channel_id)})
        if not channel:
            return jsonify({"error": "Channel not found"}), 404
        if str(channel.get("owner_id")) != user_id:
            return jsonify({"error": "Forbidden"}), 403

        token_doc = get_active_token(channel_id)
        if not token_doc:
            return jsonify({"error": "No active verification token. Call request-verification first."}), 400

        telegram_link = channel.get("telegram_link", "")
        match = re.search(r"(t\.me|telegram\.me)/([a-zA-Z0-9_]+)", telegram_link)
        if not match:
            return jsonify({"error": "Channel has invalid Telegram link"}), 400

        username = match.group(2)
        token = token_doc["token"]

        from utils.telethon_runner import run_telethon
        found = run_telethon(_check_channel_for_token(username, token))

        if not found:
            return jsonify({
                "error": f"Code '{token}' not found in recent channel posts. Please post it and try again."
            }), 422

        mark_token_used(str(token_doc["_id"]))
        channels_collection.update_one(
            {"_id": ObjectId(channel_id)},
            {"$set": {"ownership_verified": True}},
        )
        return jsonify({
            "message": "Channel ownership verified successfully!",
            "channel_id": channel_id,
        }), 200
    except Exception:
        return jsonify({"error": "Verification check failed"}), 500
