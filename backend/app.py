from flask import Flask, send_from_directory, request, make_response
from dotenv import load_dotenv
import os

load_dotenv()

from extensions import limiter
from routes.user_routes import user_bp
from routes.channels import channel_bp
from routes.upload import upload_bp
from routes.ad_requests import ad_request_bp
from routes.llm import llm_bp
from routes.telegram_api import telegram_bp
from routes.verification import verification_bp

app = Flask(__name__)
secret_key = os.getenv("SECRET_KEY")
if not secret_key:
    import warnings
    warnings.warn("SECRET_KEY not set — using insecure default. Set SECRET_KEY in .env for production.")
    secret_key = "dev-insecure-default-change-in-production"
app.secret_key = secret_key
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True

allowed_origins = [o.strip() for o in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")]

@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        origin = request.headers.get('Origin', '')
        res = make_response()
        if origin in allowed_origins:
            res.headers['Access-Control-Allow-Origin'] = origin
            res.headers['Access-Control-Allow-Credentials'] = 'true'
        else:
            res.headers['Access-Control-Allow-Origin'] = '*'
        res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        res.headers['Access-Control-Max-Age'] = '86400'
        return res

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin', '')
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

limiter.init_app(app)

app.register_blueprint(user_bp, url_prefix='/api/auth')
app.register_blueprint(channel_bp, url_prefix='/api')
app.register_blueprint(upload_bp, url_prefix="/api")
app.register_blueprint(ad_request_bp, url_prefix='/api')
app.register_blueprint(llm_bp, url_prefix='/api')
app.register_blueprint(telegram_bp, url_prefix="/api")
app.register_blueprint(verification_bp, url_prefix="/api")

@app.route('/api/ping', methods=['GET', 'POST', 'OPTIONS'])
def ping():
    from flask import jsonify
    return jsonify({"ping": "pong", "origin": request.headers.get('Origin', 'none')})

@app.route('/health')
def health():
    from flask import jsonify
    mongo_status = "unknown"
    mongo_error = None
    try:
        from models.user_model import client
        client.admin.command('ping')
        mongo_status = "connected"
    except Exception as e:
        mongo_status = "error"
        mongo_error = str(e)
    return jsonify({
        "status": "ok",
        "frontend_url": os.getenv("FRONTEND_URL", "NOT SET"),
        "mongo": mongo_status,
        "mongo_error": mongo_error
    })

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory('static/uploads', filename)

if __name__ == '__main__':
    app.run(debug=True)
