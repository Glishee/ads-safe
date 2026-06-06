import hmac
import hashlib
import base64
import os
from functools import wraps
from flask import session, jsonify, request
from bson import ObjectId
from models.user_model import users_collection
from models.channel_model import channels_collection


def _make_token(user_id):
    secret = os.getenv("SECRET_KEY", "dev-insecure-default")
    sig = hmac.new(secret.encode(), user_id.encode(), hashlib.sha256).hexdigest()
    return base64.b64encode(f"{user_id}:{sig}".encode()).decode()


def _verify_token(token):
    try:
        decoded = base64.b64decode(token.encode()).decode()
        user_id, sig = decoded.rsplit(":", 1)
        secret = os.getenv("SECRET_KEY", "dev-insecure-default")
        expected = hmac.new(secret.encode(), user_id.encode(), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, expected):
            return user_id
    except Exception:
        pass
    return None


def get_user_id():
    """Returns authenticated user_id from X-Auth-Token header or session."""
    token = request.headers.get("X-Auth-Token")
    if token:
        uid = _verify_token(token)
        if uid:
            return uid
    return session.get("user_id")


def _get_current_user():
    user_id = get_user_id()
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
        if not get_user_id():
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
