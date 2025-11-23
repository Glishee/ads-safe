from telethon.sync import TelegramClient
import os
from dotenv import load_dotenv

load_dotenv()

API_ID = int(os.getenv("TELEGRAM_API_ID"))
API_HASH = os.getenv("TELEGRAM_API_HASH")

with TelegramClient("telegram_session", API_ID, API_HASH) as client:
    print("✅ Session saved successfully.")
