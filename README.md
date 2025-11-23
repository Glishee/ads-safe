SafeAdds

SafeAdds is a platform for safe advertisement management in Telegram channels.
It includes a backend (Flask), a frontend (React + Vite), Telegram integration, and AI-based ad text moderation.

🚀 Features

User registration and authentication

Telegram channel management

Image and file uploads

Creating advertisement requests

Automatic moderation using a local LLM (Ollama + deepseek-r1)

Telegram integration using Telethon

Secure API with CORS support

🧱 Tech Stack
Backend

Python (Flask)

MongoDB (pymongo)

Telethon

Flask-CORS

📁 Project Structure
SafeAdds/
│
├── backend/
│   ├── app.py
│   ├── routes/
│   ├── static/uploads/
│   └── .env
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── src/
    └── .env
python-dotenv

requests

Frontend

React

Vite

JavaScript

Fetch / Axios
⚙️ Installation
1. Clone the repository
git clone https://github.com/Glishee/ads-safe.git
cd ads-safe
🐍 Backend Setup (Flask)
2. Create and activate virtual environment
cd backend
python -m venv venv
venv\Scripts\activate

3. Install dependencies
pip install Flask flask-cors pymongo python-dotenv requests telethon

4. Create .env file
FLASK_ENV=development
MONGO_URI=mongodb://localhost:27017/safeadds
SECRET_KEY=your-secret-key
LLM_API_URL=http://localhost:11434

# Telethon
TELEGRAM_API_ID=123456
TELEGRAM_API_HASH=your_hash
TELEGRAM_BOT_TOKEN=your_bot_token

5. Run backend
python -m flask run


Backend URL: http://localhost:5000

🌐 Frontend Setup (React + Vite)
1. Install dependencies
cd ../frontend
npm install

2. Create .env
VITE_API_URL=http://localhost:5000

3. Start frontend
npm run dev


Frontend URL: http://localhost:5173
