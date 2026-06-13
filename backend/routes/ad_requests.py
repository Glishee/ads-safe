from flask import Blueprint, request, jsonify, session
from datetime import datetime
from bson import ObjectId
import os
import logging
import cloudinary
import cloudinary.uploader
from werkzeug.utils import secure_filename
from models.ad_request_model import ad_requests_collection, serialize_ad_request
from models.user_model import users_collection
from models.channel_model import channels_collection
from routes.llm import moderate_text
from middleware.auth import require_auth, require_admin
from extensions import limiter

logger = logging.getLogger(__name__)

ad_request_bp = Blueprint("ad_request", __name__)
UPLOAD_FOLDER = "static/uploads"
BACKEND_PUBLIC_URL = os.getenv("BACKEND_PUBLIC_URL", "").rstrip("/")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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

def upload_media(file):
    if _configure_cloudinary():
        logger.info("Uploading to Cloudinary: %s", file.filename)
        file_bytes = file.read()
        result = cloudinary.uploader.upload(file_bytes, folder="ads-safe", resource_type="auto")
        logger.info("Cloudinary upload success: %s", result["secure_url"])
        return result["secure_url"]
    else:
        logger.warning("Cloudinary not configured — saving locally (will be lost on restart)")
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        base = BACKEND_PUBLIC_URL if BACKEND_PUBLIC_URL else ""
        return f"{base}/static/uploads/{filename}"


@ad_request_bp.route("/cloudinary-status", methods=["GET"])
def cloudinary_status():
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    api_key = os.environ.get("CLOUDINARY_API_KEY")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    configured = bool(cloud_name and api_key and api_secret)
    return jsonify({"cloudinary_configured": configured})


@ad_request_bp.route("/ad-requests", methods=["POST"])
@require_auth
@limiter.limit("30 per hour", key_func=lambda: session.get("user_id", "anon"))
def create_ad_request():
    try:
        form = request.form.to_dict()
        file = request.files.get("media")

        media_url = None
        if file:
            try:
                media_url = upload_media(file)
            except Exception as upload_err:
                logger.error("Media upload failed: %s", upload_err, exc_info=True)
                # Continue without media rather than failing the whole request

        # Force advertiser_id from session — never trust client
        user_id = session.get("user_id")

        ad_text = form.get("ad_text", "")
        moderation_info = moderate_text(ad_text)
        is_suspicious = moderation_info.get("containsProhibitedContent", False)

        new_request = {
            "advertiser_id": user_id,
            "channel_id": form.get("channel_id"),
            "ad_text": ad_text,
            "media_url": media_url,
            "price": float(form.get("price", 0)),
            "publication_time": form.get("publication_time") or None,
            "status": "pending_admin_review" if is_suspicious else form.get("status", "pending"),
            "is_suspicious": is_suspicious,
            "moderation_info": moderation_info,
            "admin_approved": False,
            "owner_approved": False,
            "created_at": datetime.utcnow()
        }

        result = ad_requests_collection.insert_one(new_request)
        saved = ad_requests_collection.find_one({"_id": result.inserted_id})
        return jsonify(serialize_ad_request(saved)), 201

    except Exception as e:
        logger.error("Failed to create ad request: %s", e, exc_info=True)
        return jsonify({"error": "Failed to create ad request", "detail": str(e)}), 500


@ad_request_bp.route("/ad-requests", methods=["GET"])
@require_auth
def get_all_ad_requests():
    user_id = session.get("user_id")
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    is_admin = user and user.get("role") == "admin"

    query = {}
    advertiser_id = request.args.get("advertiser_id")
    channel_id    = request.args.get("channel_id")
    status        = request.args.get("status")
    channel_ids   = request.args.get("channel_id__in")

    if advertiser_id:
        if not is_admin and advertiser_id != user_id:
            return jsonify({"error": "Forbidden"}), 403
        query["advertiser_id"] = advertiser_id
    elif channel_id:
        query["channel_id"] = channel_id
        # Channel owners only see requests the admin has already reviewed
        if not is_admin:
            query["status"] = {"$nin": ["pending", "pending_admin_review"]}
    elif channel_ids:
        query["channel_id"] = {"$in": channel_ids.split(",")}
        # Channel owners only see requests the admin has already reviewed
        if not is_admin:
            query["status"] = {"$nin": ["pending", "pending_admin_review"]}
    elif not is_admin:
        query["advertiser_id"] = user_id

    if status:
        query["status"] = status

    try:
        results = ad_requests_collection.find(query).sort("created_at", -1)
        return jsonify([serialize_ad_request(r) for r in results])
    except Exception:
        return jsonify({"error": "Failed to load requests"}), 500


@ad_request_bp.route("/ad-requests/<request_id>", methods=["GET"])
@require_auth
def get_single_ad_request(request_id):
    try:
        req_doc = ad_requests_collection.find_one({"_id": ObjectId(request_id)})
        if not req_doc:
            return jsonify({"error": "Not found"}), 404

        user_id = session.get("user_id")
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        is_admin = user and user.get("role") == "admin"
        is_advertiser = str(req_doc.get("advertiser_id")) == user_id

        channel = channels_collection.find_one({"_id": ObjectId(req_doc.get("channel_id", "0" * 24))})
        is_channel_owner = channel and str(channel.get("owner_id")) == user_id

        if not (is_admin or is_advertiser or is_channel_owner):
            return jsonify({"error": "Forbidden"}), 403

        return jsonify(serialize_ad_request(req_doc))
    except Exception:
        return jsonify({"error": "Failed to load request"}), 500


@ad_request_bp.route("/ad-requests/<request_id>/approve", methods=["POST"])
@require_admin
def approve_ad_request(request_id):
    try:
        req_doc = ad_requests_collection.find_one({"_id": ObjectId(request_id)})
        if not req_doc:
            return jsonify({"error": "Ad request not found"}), 404

        update = {"admin_approved": True, "status": "admin_approved"}
        if req_doc.get("owner_approved"):
            update["status"] = "approved"

        ad_requests_collection.update_one({"_id": ObjectId(request_id)}, {"$set": update})
        updated = ad_requests_collection.find_one({"_id": ObjectId(request_id)})
        return jsonify(serialize_ad_request(updated)), 200
    except Exception:
        return jsonify({"error": "Failed to approve"}), 500


@ad_request_bp.route("/ad-requests/<request_id>/reject", methods=["POST"])
@require_admin
def reject_ad_request(request_id):
    try:
        data = request.get_json() or {}
        reason = str(data.get("reason", "Rejected by admin"))[:1000]

        result = ad_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {
                "status": "rejected",
                "rejection_reason": reason,
                "admin_approved": False,
                "owner_approved": False
            }}
        )
        if result.matched_count == 0:
            return jsonify({"error": "Ad request not found"}), 404

        updated = ad_requests_collection.find_one({"_id": ObjectId(request_id)})
        return jsonify(serialize_ad_request(updated)), 200
    except Exception:
        return jsonify({"error": "Failed to reject"}), 500


@ad_request_bp.route("/ad-requests/<request_id>", methods=["PUT"])
@require_auth
def update_ad_request(request_id):
    try:
        update_data = request.get_json()
        if not update_data:
            return jsonify({"error": "No data provided"}), 400

        user_id = session.get("user_id")
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        is_admin = user and user.get("role") == "admin"

        req_doc = ad_requests_collection.find_one({"_id": ObjectId(request_id)})
        if not req_doc:
            return jsonify({"error": "Not found"}), 404

        channel = channels_collection.find_one({"_id": ObjectId(req_doc.get("channel_id", "0" * 24))})
        is_channel_owner = channel and str(channel.get("owner_id")) == user_id
        is_advertiser = str(req_doc.get("advertiser_id")) == user_id

        if not (is_admin or is_channel_owner or is_advertiser):
            return jsonify({"error": "Forbidden"}), 403

        # Prevent self-approval
        if not is_admin:
            update_data.pop("admin_approved", None)
        if not is_channel_owner:
            update_data.pop("owner_approved", None)

        ad_requests_collection.update_one({"_id": ObjectId(request_id)}, {"$set": update_data})
        updated = ad_requests_collection.find_one({"_id": ObjectId(request_id)})
        return jsonify(serialize_ad_request(updated)), 200
    except Exception:
        return jsonify({"error": "Failed to update"}), 500
