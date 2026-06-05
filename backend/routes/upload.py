import os
import uuid
import cloudinary
import cloudinary.uploader
from flask import Blueprint, request, jsonify, session
from werkzeug.utils import secure_filename
from middleware.auth import require_auth
from extensions import limiter

upload_bp = Blueprint('upload', __name__)

_cloudinary_configured = False

def _configure_cloudinary():
    global _cloudinary_configured
    if not _cloudinary_configured:
        cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
        api_key = os.environ.get("CLOUDINARY_API_KEY")
        api_secret = os.environ.get("CLOUDINARY_API_SECRET")
        if cloud_name and api_key and api_secret:
            cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)
            _cloudinary_configured = True
    return _cloudinary_configured

UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@upload_bp.route('/upload', methods=['POST'])
@require_auth
@limiter.limit("20 per hour", key_func=lambda: session.get("user_id", "anon"))
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    if _configure_cloudinary():
        try:
            result = cloudinary.uploader.upload(
                file,
                folder="ads-safe",
                resource_type="auto"
            )
            return jsonify({'url': result['secure_url']})
        except Exception:
            return jsonify({'message': 'Cloudinary upload failed'}), 500
    else:
        ext = os.path.splitext(secure_filename(file.filename))[1].lower()
        safe_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
        file.save(file_path)
        return jsonify({'url': f'/static/uploads/{safe_filename}'})
