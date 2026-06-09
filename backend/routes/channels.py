from flask import Blueprint, request, jsonify, session
from models.channel_model import channels_collection
from models.user_model import users_collection
from bson import ObjectId
from middleware.auth import require_auth, require_admin, require_channel_owner
from utils.validators import validate_channel_data
from extensions import limiter

channel_bp = Blueprint('channel_bp', __name__)


@channel_bp.route('/channels', methods=['POST'])
@require_auth
@limiter.limit("20 per hour")
def create_channel():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    errors = validate_channel_data(data)
    if errors:
        return jsonify({'message': 'Validation failed', 'errors': errors}), 400

    required_fields = [
        'name', 'description', 'telegram_link', 'avatar_url', 'subscribers_count',
        'category', 'post_price', 'admin_username', 'admin_contact_email', 'owner_id'
    ]
    if not all(field in data for field in required_fields):
        return jsonify({'message': 'Missing required fields'}), 400

    data['is_approved'] = False
    data['is_rejected'] = False
    data['ownership_verified'] = False

    try:
        result = channels_collection.insert_one(data)
        return jsonify({'message': 'Channel created successfully', 'id': str(result.inserted_id)}), 201
    except Exception:
        return jsonify({'message': 'Failed to create channel'}), 500


@channel_bp.route('/channels', methods=['GET'])
def get_channels():
    owner_id = request.args.get('owner_id')
    is_approved = request.args.get('is_approved')

    query = {}
    if owner_id:
        query['owner_id'] = owner_id
    if is_approved is not None:
        query['is_approved'] = is_approved.lower() == 'true'

    try:
        channels = list(channels_collection.find(query))
        for ch in channels:
            ch['id'] = str(ch['_id'])
            ch['created_date'] = ch['_id'].generation_time.isoformat()
            del ch['_id']
        return jsonify(channels), 200
    except Exception:
        return jsonify({'message': 'Failed to load channels'}), 500


@channel_bp.route('/channels/<channel_id>', methods=['GET'])
def get_channel(channel_id):
    try:
        channel = channels_collection.find_one({'_id': ObjectId(channel_id)})
        if not channel:
            return jsonify({'message': 'Channel not found'}), 404
        channel['id'] = str(channel['_id'])
        channel['created_date'] = channel['_id'].generation_time.isoformat()
        del channel['_id']
        return jsonify(channel), 200
    except Exception:
        return jsonify({'message': 'Invalid channel ID'}), 400


@channel_bp.route('/channels/<channel_id>', methods=['PUT'])
@require_channel_owner
def update_channel(channel_id):
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    # Prevent self-approval
    data.pop('is_approved', None)
    data.pop('is_rejected', None)
    data.pop('ownership_verified', None)

    try:
        existing = channels_collection.find_one({'_id': ObjectId(channel_id)})
        if not existing:
            return jsonify({'message': 'Channel not found'}), 404

        # If the channel was rejected, resubmit it for review on edit
        if existing.get('is_rejected'):
            data['is_rejected'] = False
            data['is_approved'] = False
            data['rejection_reason'] = ''

        result = channels_collection.update_one({'_id': ObjectId(channel_id)}, {'$set': data})
        if result.matched_count == 0:
            return jsonify({'message': 'Channel not found'}), 404
        return jsonify({'message': 'Channel updated successfully'}), 200
    except Exception:
        return jsonify({'message': 'Failed to update channel'}), 500


@channel_bp.route('/channels/<channel_id>', methods=['DELETE'])
@require_channel_owner
def delete_channel(channel_id):
    try:
        result = channels_collection.delete_one({'_id': ObjectId(channel_id)})
        if result.deleted_count == 0:
            return jsonify({'message': 'Channel not found'}), 404
        return jsonify({'message': 'Channel deleted successfully'}), 200
    except Exception:
        return jsonify({'message': 'Failed to delete channel'}), 500


@channel_bp.route('/channels/<channel_id>/approve', methods=['POST'])
@require_admin
def approve_channel(channel_id):
    try:
        result = channels_collection.update_one(
            {'_id': ObjectId(channel_id)},
            {'$set': {'is_approved': True, 'is_rejected': False}}
        )
        if result.matched_count == 0:
            return jsonify({'message': 'Channel not found'}), 404
        return jsonify({'message': 'Channel approved'}), 200
    except Exception:
        return jsonify({'message': 'Failed to approve channel'}), 500


@channel_bp.route('/channels/<channel_id>/reject', methods=['POST'])
@require_admin
def reject_channel(channel_id):
    try:
        data = request.get_json(silent=True) or {}
        reason = (data.get('reason') or '').strip()
        result = channels_collection.update_one(
            {'_id': ObjectId(channel_id)},
            {'$set': {'is_approved': False, 'is_rejected': True, 'rejection_reason': reason}}
        )
        if result.matched_count == 0:
            return jsonify({'message': 'Channel not found'}), 404
        return jsonify({'message': 'Channel rejected'}), 200
    except Exception:
        return jsonify({'message': 'Failed to reject channel'}), 500
