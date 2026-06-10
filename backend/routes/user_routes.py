from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from models.user_model import users_collection
from extensions import limiter
from middleware.auth import _make_token, get_user_id
import traceback
import uuid
import os

user_bp = Blueprint('user_bp', __name__)


# ---------------------------------------------------------------------------
# Email helper
# ---------------------------------------------------------------------------

def _send_verification_email(to_email, username, token):
    """Send verification email via Resend. Falls back to console log if not configured."""
    frontend_url = os.getenv("FRONTEND_URL", "https://ads-safe.vercel.app")
    verify_link = f"{frontend_url}/VerifyEmail?token={token}"

    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        print(f"[EMAIL] RESEND_API_KEY not set — verification link for {to_email}:")
        print(f"[EMAIL] {verify_link}")
        return

    print(f"[EMAIL] Sending verification email to {to_email} via Resend...")
    try:
        import resend
        resend.api_key = api_key

        html_body = f"""
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#2563EB;padding:28px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">AdMarket</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 12px;font-size:20px;">Confirm your email</h2>
      <p style="color:#555;line-height:1.6;margin:0 0 24px;">
        Hi <strong>{username}</strong>, thanks for signing up!<br>
        Click the button below to verify your email address.
      </p>
      <a href="{verify_link}"
         style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;
                padding:13px 28px;border-radius:8px;font-weight:600;font-size:15px;">
        Verify Email
      </a>
      <p style="color:#999;font-size:12px;margin:24px 0 0;">
        Or copy this link:<br>
        <a href="{verify_link}" style="color:#2563EB;word-break:break-all;">{verify_link}</a>
      </p>
      <p style="color:#bbb;font-size:11px;margin:16px 0 0;">
        This link expires in 24 hours. If you didn't create an account, ignore this email.
      </p>
    </div>
  </div>
</body>
</html>"""

        result = resend.Emails.send({
            "from": "AdMarket <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "Verify your AdMarket account",
            "html": html_body,
        })
        print(f"[EMAIL] Sent OK — id={getattr(result, 'id', result)}")
        print(f"[EMAIL] Verify link: {verify_link}")
    except Exception as e:
        import traceback
        print(f"[EMAIL ERROR] {e}")
        traceback.print_exc()
        print(f"[EMAIL] Manual verify link: {verify_link}")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@user_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    try:
        data = request.get_json()
        username         = data.get('username')
        password         = data.get('password')
        email            = (data.get('email') or '').strip().lower()
        application_role = data.get('application_role')

        if not username or not password or not email or not application_role:
            return jsonify({'message': 'Missing fields'}), 400

        if users_collection.find_one({'email': email}):
            return jsonify({'message': 'Email already in use'}), 409

        if users_collection.find_one({'username': username}):
            return jsonify({'message': 'User already exists'}), 409

        token = str(uuid.uuid4())

        hashed_password = generate_password_hash(password)
        users_collection.insert_one({
            'username':         username,
            'email':            email,
            'role':             'user',
            'application_role': application_role,
            'password':         hashed_password,
            'is_email_verified': False,
            'email_token':      token,
        })

        _send_verification_email(email, username, token)

        return jsonify({'message': 'User created successfully', 'email_sent': True}), 201

    except Exception as e:
        print("REGISTRATION ERROR:", e)
        traceback.print_exc()
        return jsonify({'message': 'Internal Server Error'}), 500


@user_bp.route('/verify-email', methods=['GET'])
def verify_email():
    token = request.args.get('token', '').strip()
    if not token:
        return jsonify({'message': 'Missing token'}), 400

    user = users_collection.find_one({'email_token': token})
    if not user:
        return jsonify({'message': 'Invalid or expired token'}), 400

    users_collection.update_one(
        {'_id': user['_id']},
        {'$set': {'is_email_verified': True}, '$unset': {'email_token': ''}}
    )
    return jsonify({'message': 'Email verified successfully'}), 200


@user_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    data  = request.get_json() or {}
    email = data.get('email', '').strip()
    if not email:
        return jsonify({'message': 'Email required'}), 400

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    if user.get('is_email_verified'):
        return jsonify({'message': 'Email already verified'}), 400

    token = str(uuid.uuid4())
    users_collection.update_one({'_id': user['_id']}, {'$set': {'email_token': token}})
    _send_verification_email(email, user.get('username', ''), token)
    return jsonify({'message': 'Verification email resent'}), 200


@user_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    import re as _re
    data       = request.get_json()
    identifier = (data.get('identifier') or data.get('email') or '').strip()
    password   = data.get('password')

    if not identifier or not password:
        return jsonify({'message': 'Missing email/username or password'}), 400

    identifier_lower = identifier.lower()
    user = users_collection.find_one({
        '$or': [
            {'email':    {'$regex': f'^{_re.escape(identifier_lower)}$', '$options': 'i'}},
            {'username': {'$regex': f'^{_re.escape(identifier)}$',       '$options': 'i'}},
        ]
    })
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid credentials'}), 401

    if not user.get('is_email_verified', True):
        return jsonify({'message': 'Please verify your email before logging in', 'email_not_verified': True}), 403

    if user.get('is_blocked'):
        return jsonify({'message': 'Your account has been blocked. Please contact support.', 'is_blocked': True}), 403

    user_id = str(user['_id'])
    session['user_id'] = user_id

    return jsonify({
        'message':          'Login successful',
        'id':               user_id,
        'username':         user['username'],
        'role':             user['role'],
        'application_role': user.get('application_role', None),
        'auth_token':       _make_token(user_id),
    }), 200


@user_bp.route('/profile', methods=['PUT'])
def update_profile():
    user_id = get_user_id()
    if not user_id:
        return jsonify({'message': 'Not logged in'}), 401

    data = request.get_json() or {}
    updates = {}

    new_username = data.get('username', '').strip()
    new_email    = data.get('email', '').strip()
    current_pw   = data.get('current_password', '')
    new_pw       = data.get('new_password', '')

    current_user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not current_user:
        return jsonify({'message': 'User not found'}), 404

    if new_username and new_username != current_user.get('username'):
        if users_collection.find_one({'username': new_username}):
            return jsonify({'message': 'Username already taken'}), 409
        updates['username'] = new_username

    if new_email and new_email != current_user.get('email'):
        if users_collection.find_one({'email': new_email}):
            return jsonify({'message': 'Email already in use'}), 409
        updates['email'] = new_email

    if new_pw:
        if not current_pw:
            return jsonify({'message': 'Current password required'}), 400
        if not check_password_hash(current_user['password'], current_pw):
            return jsonify({'message': 'Current password is incorrect'}), 400
        if len(new_pw) < 6:
            return jsonify({'message': 'New password must be at least 6 characters'}), 400
        updates['password'] = generate_password_hash(new_pw)

    if not updates:
        return jsonify({'message': 'Nothing to update'}), 400

    users_collection.update_one({'_id': ObjectId(user_id)}, {'$set': updates})
    updated = users_collection.find_one({'_id': ObjectId(user_id)})
    return jsonify({
        'id':               str(updated['_id']),
        'username':         updated.get('username'),
        'email':            updated.get('email'),
        'role':             updated.get('role', 'user'),
        'application_role': updated.get('application_role'),
    }), 200


@user_bp.route('/profile', methods=['GET'])
def profile():
    user_id = get_user_id()
    if not user_id:
        return jsonify({'message': 'Not logged in'}), 401

    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify({
        'id':               str(user['_id']),
        'username':         user['username'],
        'email':            user['email'],
        'role':             user.get('role', 'user'),
        'application_role': user.get('application_role'),
    }), 200


@user_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'}), 200


@user_bp.route('/users/<user_id>', methods=['GET'])
def get_user_by_id(user_id):
    requester_id = get_user_id()
    if not requester_id:
        return jsonify({'message': 'Not logged in'}), 401

    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
    except Exception:
        return jsonify({'message': 'Invalid user ID'}), 400

    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify({
        'id':               str(user['_id']),
        'username':         user.get('username'),
        'email':            user.get('email'),
        'application_role': user.get('application_role'),
    }), 200


@user_bp.route('/users', methods=['GET'])
def list_users():
    user_id = get_user_id()
    if not user_id:
        return jsonify({'message': 'Not logged in'}), 401

    current_user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not current_user or current_user.get('role') != 'admin':
        return jsonify({'message': 'Forbidden'}), 403

    all_users = list(users_collection.find())
    result = []
    for u in all_users:
        result.append({
            'id':                str(u['_id']),
            'username':          u.get('username'),
            'email':             u.get('email'),
            'role':              u.get('role', 'user'),
            'application_role':  u.get('application_role'),
            'is_blocked':        u.get('is_blocked', False),
            'is_email_verified': u.get('is_email_verified', True),
            'created_date':      str(u['_id'].generation_time.isoformat()) if '_id' in u else None,
            'last_login':        u.get('last_login'),
            'phone':             u.get('phone'),
            'profile_image':     u.get('profile_image'),
        })
    return jsonify(result), 200


@user_bp.route('/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    requester_id = get_user_id()
    if not requester_id:
        return jsonify({'message': 'Not logged in'}), 401

    current_user = users_collection.find_one({'_id': ObjectId(requester_id)})
    if not current_user or current_user.get('role') != 'admin':
        return jsonify({'message': 'Forbidden'}), 403

    try:
        target = users_collection.find_one({'_id': ObjectId(user_id)})
    except Exception:
        return jsonify({'message': 'Invalid user ID'}), 400

    if not target:
        return jsonify({'message': 'User not found'}), 404

    if target.get('role') == 'admin':
        return jsonify({'message': 'Cannot modify admin users'}), 403

    data = request.get_json() or {}
    allowed = {'is_blocked'}
    updates = {k: v for k, v in data.items() if k in allowed}
    if not updates:
        return jsonify({'message': 'No valid fields to update'}), 400

    users_collection.update_one({'_id': ObjectId(user_id)}, {'$set': updates})
    updated = users_collection.find_one({'_id': ObjectId(user_id)})
    return jsonify({
        'id':               str(updated['_id']),
        'username':         updated.get('username'),
        'email':            updated.get('email'),
        'role':             updated.get('role', 'user'),
        'application_role': updated.get('application_role'),
        'is_blocked':       updated.get('is_blocked', False),
    }), 200
