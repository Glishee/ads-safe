from functools import wraps
from flask import session, jsonify, request
from bson import ObjectId
from models.user_model import users_collection
from models.channel_model import channels_collection


def _get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    try:
        return users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return f(*args, **kwargs)
        if not session.get("user_id"):
            return jsonify({"message": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return f(*args, **kwargs)
        user = _get_current_user()
        if user is None:
            return jsonify({"message": "Authentication required"}), 401
        if user.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated


def require_channel_owner(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return f(*args, **kwargs)
        user = _get_current_user()
        if user is None:
            return jsonify({"message": "Authentication required"}), 401

        channel_id = kwargs.get("channel_id")
        if not channel_id:
            return jsonify({"message": "Missing channel ID"}), 400

        try:
            channel = channels_collection.find_one({"_id": ObjectId(channel_id)})
        except Exception:
            return jsonify({"message": "Invalid channel ID"}), 400

        if channel is None:
            return jsonify({"message": "Channel not found"}), 404

        is_admin = user.get("role") == "admin"
        is_owner = str(channel.get("owner_id")) == str(user["_id"])

        if not (is_admin or is_owner):
            return jsonify({"message": "Permission denied"}), 403

        return f(*args, **kwargs)
    return decorated
