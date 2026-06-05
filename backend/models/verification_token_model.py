from pymongo import MongoClient, ASCENDING
from datetime import datetime, timedelta
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["telegramadvsite"]
verification_tokens_collection = db["verification_tokens"]


def _ensure_indexes():
    try:
        verification_tokens_collection.create_index(
            [("expires_at", ASCENDING)],
            expireAfterSeconds=0,
            background=True,
        )
    except Exception:
        pass


def create_verification_token(channel_id: str, owner_id: str, token: str) -> dict:
    _ensure_indexes()
    now = datetime.utcnow()
    doc = {
        "channel_id": channel_id,
        "owner_id": owner_id,
        "token": token,
        "created_at": now,
        "expires_at": now + timedelta(hours=1),
        "used": False,
    }
    result = verification_tokens_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


def get_active_token(channel_id: str):
    return verification_tokens_collection.find_one(
        {
            "channel_id": channel_id,
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()},
        },
        sort=[("created_at", -1)],
    )


def mark_token_used(token_id: str) -> None:
    verification_tokens_collection.update_one(
        {"_id": ObjectId(token_id)},
        {"$set": {"used": True}},
    )
