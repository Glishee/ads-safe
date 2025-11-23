import os
from pymongo import MongoClient
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client['telegramadvsite']
users_collection = db['users']

def create_user(username, password, email, name):
    if users_collection.find_one({'username': username}):
        return {'message': 'User already exists'}
    
    hashed_password = generate_password_hash(password)
    users_collection.insert_one({
        'email' : email,
				'name' : name,
        'username': username,
        'password': hashed_password
    })
    return {'message': 'User created successfully'}
