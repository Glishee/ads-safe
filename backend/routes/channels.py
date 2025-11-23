from flask import Blueprint, request, jsonify
from models.channel_model import channels_collection
from bson import ObjectId
from flask import session
from models.user_model import users_collection 

channel_bp = Blueprint('channel_bp', __name__)


@channel_bp.route('/channels', methods=['POST'])
def create_channel():
    data = request.get_json()
    required_fields = [
        'name', 'description', 'telegram_link', 'avatar_url', 'subscribers_count',
        'category', 'post_price', 'admin_username', 'admin_contact_email', 'owner_id'
    ]
    if not all(field in data for field in required_fields):
        return jsonify({'message': 'Missing required fields'}), 400

    
    data['is_approved'] = False
    data['is_rejected'] = False

    result = channels_collection.insert_one(data)
    return jsonify({'message': 'Channel created successfully', 'id': str(result.inserted_id)}), 201


@channel_bp.route('/channels', methods=['GET'])
def get_channels():
    owner_id = request.args.get('owner_id')
    is_approved = request.args.get('is_approved')

    query = {}
    if owner_id:
        query['owner_id'] = owner_id
    if is_approved is not None:
         query['is_approved'] = is_approved.lower() == 'true'

    channels = list(channels_collection.find(query))
    for ch in channels:
        ch['id'] = str(ch['_id'])
        del ch['_id']
    return jsonify(channels), 200


@channel_bp.route('/channels/<channel_id>', methods=['GET'])
def get_channel(channel_id):
    try:
        channel = channels_collection.find_one({'_id': ObjectId(channel_id)})
        if not channel:
            return jsonify({'message': 'Channel not found'}), 404
        channel['id'] = str(channel['_id'])
        del channel['_id']
        return jsonify(channel), 200
    except Exception:
        return jsonify({'message': 'Invalid channel ID'}), 400


@channel_bp.route('/channels/<channel_id>', methods=['PUT'])
def update_channel(channel_id):
    data = request.get_json()
    result = channels_collection.update_one({'_id': ObjectId(channel_id)}, {'$set': data})
    if result.matched_count == 0:
        return jsonify({'message': 'Channel not found'}), 404
    return jsonify({'message': 'Channel updated successfully'}), 200


@channel_bp.route('/channels/<channel_id>', methods=['DELETE'])
def delete_channel(channel_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({'message': 'Not logged in'}), 401

    
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    
    channel = channels_collection.find_one({'_id': ObjectId(channel_id)})
    if not channel:
        return jsonify({'message': 'Channel not found'}), 404

   
    is_admin = user.get("role") == "admin"
    is_owner = str(channel.get("owner_id")) == user_id

    if not (is_admin or is_owner):
        return jsonify({'message': 'Permission denied'}), 403

    
    result = channels_collection.delete_one({'_id': ObjectId(channel_id)})
    if result.deleted_count == 0:
        return jsonify({'message': 'Channel not deleted'}), 500

    return jsonify({'message': 'Channel deleted successfully'}), 200


@channel_bp.route('/channels/<channel_id>/approve', methods=['POST'])
def approve_channel(channel_id):
    result = channels_collection.update_one(
        {'_id': ObjectId(channel_id)},
        {'$set': {'is_approved': True, 'is_rejected': False}}
    )
    if result.matched_count == 0:
        return jsonify({'message': 'Channel not found'}), 404
    return jsonify({'message': 'Channel approved'}), 200


@channel_bp.route('/channels/<channel_id>/reject', methods=['POST'])
def reject_channel(channel_id):
    result = channels_collection.update_one(
        {'_id': ObjectId(channel_id)},
        {'$set': {'is_approved': False, 'is_rejected': True}}
    )
    if result.matched_count == 0:
        return jsonify({'message': 'Channel not found'}), 404
    return jsonify({'message': 'Channel rejected'}), 200
