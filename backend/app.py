from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

from routes.user_routes import user_bp
from routes.channels import channel_bp
from routes.upload import upload_bp
from routes.ad_requests import ad_request_bp
from routes.llm import llm_bp
from routes.telegram_api import telegram_bp  # 🆕

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your-super-secret-key")
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True


allowed_origins = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")

CORS(
    app,
    resources={r"/api/*": {"origins": allowed_origins}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "DELETE", "PUT", "OPTIONS"],
)

# 👇 Регистрируем блюпринты
app.register_blueprint(user_bp, url_prefix='/api/auth')
app.register_blueprint(channel_bp, url_prefix='/api')
app.register_blueprint(upload_bp, url_prefix="/api")
app.register_blueprint(ad_request_bp, url_prefix='/api')
app.register_blueprint(llm_bp, url_prefix='/api')
app.register_blueprint(telegram_bp, url_prefix="/api")  # 🆕

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory('static/uploads', filename)

if __name__ == '__main__':
    app.run(debug=True)
