from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
import os, json
from werkzeug.utils import secure_filename
from models.ad_request_model import ad_requests_collection, serialize_ad_request
from routes.llm import moderate_text  

ad_request_bp = Blueprint("ad_request", __name__)
UPLOAD_FOLDER = "static/uploads"
BACKEND_PUBLIC_URL = os.getenv("BACKEND_PUBLIC_URL", "").rstrip("/")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@ad_request_bp.route("/ad-requests", methods=["POST"])
def create_ad_request():
    try:
        form = request.form.to_dict()
        file = request.files.get("media")

        media_url = None
        if file:
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            base = BACKEND_PUBLIC_URL if BACKEND_PUBLIC_URL else ""
            media_url = f"{base}/static/uploads/{filename}"

        def parse_bool(val):
            return str(val).lower() in ["true", "1", "yes"]

        # AI moderation
        ad_text = form.get("ad_text", "")
        moderation_info = moderate_text(ad_text)
        is_suspicious = moderation_info.get("containsProhibitedContent", False)

        new_request = {
            "advertiser_id": form.get("advertiser_id"),
            "channel_id": form.get("channel_id"),
            "ad_text": ad_text,
            "media_url": media_url,
            "price": float(form.get("price", 0)),
            "publication_time": form.get("publication_time") or None,
            "status": form.get("status", "pending"),
            "is_suspicious": is_suspicious,
            "moderation_info": moderation_info,
            "admin_approved": parse_bool(form.get("admin_approved", False)),
            "owner_approved": parse_bool(form.get("owner_approved", False)),
            "created_at": datetime.utcnow()
        }

        result = ad_requests_collection.insert_one(new_request)
        saved = ad_requests_collection.find_one({"_id": result.inserted_id})

        return jsonify(serialize_ad_request(saved)), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ad_request_bp.route("/ad-requests", methods=["GET"])
def get_all_ad_requests():
    all_requests = ad_requests_collection.find()
    return jsonify([serialize_ad_request(r) for r in all_requests])

@ad_request_bp.route("/ad-requests/<request_id>", methods=["GET"])
def get_single_ad_request(request_id):
    request_doc = ad_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not request_doc:
        return jsonify({"error": "Not found"}), 404
    return jsonify(serialize_ad_request(request_doc))

@ad_request_bp.route("/ad-requests/<request_id>/approve", methods=["POST"])
def approve_ad_request(request_id):
    try:
        request_doc = ad_requests_collection.find_one({"_id": ObjectId(request_id)})
        if not request_doc:
            return jsonify({"error": "Ad request not found"}), 404

        update = {
            "admin_approved": True,
            "status": "admin_approved",
        }

        if request_doc.get("owner_approved"):
            update["status"] = "approved"

        ad_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update}
        )
        updated = ad_requests_collection.find_one({"_id": ObjectId(request_id)})
        return jsonify(serialize_ad_request(updated)), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ad_request_bp.route("/ad-requests/<request_id>/reject", methods=["POST"])
def reject_ad_request(request_id):
    try:
        data = request.get_json() or {}
        reason = data.get("reason", "Rejected by admin")

        result = ad_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": "rejected",
                    "rejection_reason": reason,
                    "admin_approved": False,
                    "owner_approved": False
                }
            }
        )

        if result.matched_count == 0:
            return jsonify({"error": "Ad request not found"}), 404

        updated = ad_requests_collection.find_one({"_id": ObjectId(request_id)})
        return jsonify(serialize_ad_request(updated)), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ad_request_bp.route("/ad-requests/<request_id>", methods=["PUT"])
def update_ad_request(request_id):
    try:
        update_data = request.get_json()
        if not update_data:
            return jsonify({"error": "No data provided"}), 400

        result = ad_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Ad request not found"}), 404

        updated = ad_requests_collection.find_one({"_id": ObjectId(request_id)})
        return jsonify(serialize_ad_request(updated)), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
