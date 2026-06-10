from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from models.user_model import users_collection
from models.settings_model import get_settings, save_settings

settings_bp = Blueprint("settings_bp", __name__)


def _require_admin():
    user_id = session.get("user_id")
    if not user_id:
        return None, (jsonify({"message": "Not logged in"}), 401)
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") != "admin":
        return None, (jsonify({"message": "Forbidden"}), 403)
    return user, None


@settings_bp.route("/admin/settings", methods=["GET"])
def admin_get_settings():
    _, err = _require_admin()
    if err:
        return err
    return jsonify(get_settings()), 200


@settings_bp.route("/admin/settings", methods=["PUT"])
def admin_save_settings():
    _, err = _require_admin()
    if err:
        return err
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400
    updated = save_settings(data)
    return jsonify(updated), 200
