from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from models.user_model import users_collection
import traceback

user_bp = Blueprint('user_bp', __name__)


@user_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        application_role = data.get('application_role')

        if not username or not password or not email or not application_role:
            return jsonify({'message': 'Missing fields'}), 400

        if users_collection.find_one({'username': username}):
            return jsonify({'message': 'User already exists'}), 409

        hashed_password = generate_password_hash(password)
        users_collection.insert_one({
            'username': username,
            'email': email,
            'role': 'user',
            'application_role': application_role,
            'password': hashed_password
        })

        return jsonify({'message': 'User created successfully'}), 201

    except Exception as e:
        print("REGISTRATION ERROR:", e)
        traceback.print_exc()
        return jsonify({'message': 'Internal Server Error'}), 500



@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Missing email or password'}), 400

    user = users_collection.find_one({'email': email})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid credentials'}), 401

    session['user_id'] = str(user['_id'])  

    return jsonify({
        'message': 'Login successful',
        'username': user['username'],
        'role': user['role'],
        'application_role': user.get('application_role', None)
    }), 200



@user_bp.route('/profile', methods=['GET'])
def profile():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({'message': 'Not logged in'}), 401

    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify({
        'id': str(user['_id']),
        'username': user['username'],
        'email': user['email'],
        'role': user.get('role', 'user'),
        'application_role': user.get('application_role')
    }), 200

@user_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'}), 200




