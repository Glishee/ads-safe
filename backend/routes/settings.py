from flask import Blueprint, request, jsonify
from models.settings_model import get_settings, save_settings
from models.user_model import users_collection
from middleware.auth import get_user_id
from bson import ObjectId

settings_bp = Blueprint('settings_bp', __name__)


def _require_admin():
    user_id = get_user_id()
    if not user_id:
        return None, (jsonify({'message': 'Not logged in'}), 401)
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user or user.get('role') != 'admin':
        return None, (jsonify({'message': 'Forbidden'}), 403)
    return user, None


@settings_bp.route('/admin/settings', methods=['GET'])
def get_system_settings():
    _, err = _require_admin()
    if err:
        return err
    return jsonify(get_settings()), 200


@settings_bp.route('/admin/settings', methods=['PUT'])
def update_system_settings():
    _, err = _require_admin()
    if err:
        return err
    data = request.get_json() or {}
    updated = save_settings(data)
    return jsonify(updated), 200
