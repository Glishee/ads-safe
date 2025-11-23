from pymongo import MongoClient
import os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client['telegramadvsite']
ad_requests_collection = db['ad_requests']

def serialize_ad_request(doc):
    return {
        "id": str(doc.get("_id")),
        "advertiser_id": doc.get("advertiser_id"),
        "channel_id": doc.get("channel_id"),
        "ad_text": doc.get("ad_text"),
        "media_url": doc.get("media_url"),
        "price": doc.get("price"),
        "publication_time": doc.get("publication_time"),
        "status": doc.get("status"),
        "is_suspicious": doc.get("is_suspicious", False),
        "moderation_info": doc.get("moderation_info"),
        "admin_approved": doc.get("admin_approved", False),
        "owner_approved": doc.get("owner_approved", False),
        "created_at": doc.get("created_at")
    }