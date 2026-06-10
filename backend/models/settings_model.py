from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
db = client[os.getenv("MONGO_DB", "admarket")]
settings_collection = db["system_settings"]

DEFAULT_SETTINGS = {
    "support_email": "",
    "support_telegram": "",
    "commission_rate": 10,
    "min_post_price": 50,
    "max_post_price": 10000,
    "allow_registration": True,
    "require_email_verification": False,
    "auto_approve_channels": False,
    "auto_approve_ad_requests": False,
    "maintenance_mode": False,
    "maintenance_message": "We're currently undergoing maintenance. Please check back soon.",
}


def get_settings():
    doc = settings_collection.find_one({"_id": "global"})
    if not doc:
        return dict(DEFAULT_SETTINGS)
    result = dict(DEFAULT_SETTINGS)
    result.update({k: v for k, v in doc.items() if k != "_id"})
    return result


def save_settings(data):
    allowed = set(DEFAULT_SETTINGS.keys())
    update = {k: v for k, v in data.items() if k in allowed}
    settings_collection.update_one(
        {"_id": "global"},
        {"$set": update},
        upsert=True,
    )
    return get_settings()
