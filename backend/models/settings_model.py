import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client['telegramadvsite']
settings_collection = db['system_settings']

DEFAULT_SETTINGS = {
    "platform_name": "TeleAds",
    "support_email": "",
    "support_telegram": "",
    "commission_rate": 10,
    "min_post_price": 50,
    "max_post_price": 10000,
    "allow_registration": True,
    "require_email_verification": True,
    "auto_approve_channels": False,
    "auto_approve_ad_requests": False,
    "maintenance_mode": False,
    "maintenance_message": "",
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
    updates = {k: v for k, v in data.items() if k in allowed}
    settings_collection.update_one(
        {"_id": "global"},
        {"$set": updates},
        upsert=True,
    )
    return get_settings()
