import re

MAX_TEXT_LENGTH = 4000
MAX_CHANNEL_DESCRIPTION_LENGTH = 2000
MIN_PRICE = 0.01
MAX_PRICE = 100_000
MAX_NAME_LENGTH = 200
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/webm"
}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
TELEGRAM_LINK_RE = re.compile(r"(t\.me|telegram\.me)/[a-zA-Z0-9_]+")


def validate_channel_data(data: dict) -> list:
    errors = []

    name = data.get("name", "")
    if not name or not str(name).strip():
        errors.append("Channel name is required")
    elif len(str(name)) > MAX_NAME_LENGTH:
        errors.append(f"Channel name must be under {MAX_NAME_LENGTH} characters")

    description = data.get("description", "")
    if len(str(description)) > MAX_CHANNEL_DESCRIPTION_LENGTH:
        errors.append(f"Description must be under {MAX_CHANNEL_DESCRIPTION_LENGTH} characters")

    telegram_link = data.get("telegram_link", "")
    if not telegram_link or not TELEGRAM_LINK_RE.search(str(telegram_link)):
        errors.append("A valid Telegram link is required (e.g. https://t.me/channel)")

    try:
        price = float(data.get("post_price", -1))
        if price < MIN_PRICE or price > MAX_PRICE:
            errors.append(f"Price must be between {MIN_PRICE} and {MAX_PRICE}")
    except (TypeError, ValueError):
        errors.append("Price must be a number")

    email = data.get("admin_contact_email", "")
    if email and not EMAIL_RE.match(str(email)):
        errors.append("admin_contact_email is not a valid email address")

    try:
        subs = int(data.get("subscribers_count", 0))
        if subs < 0:
            errors.append("subscribers_count cannot be negative")
    except (TypeError, ValueError):
        errors.append("subscribers_count must be an integer")

    return errors


def validate_ad_request_data(form: dict) -> list:
    errors = []

    ad_text = form.get("ad_text", "")
    if not ad_text or not str(ad_text).strip():
        errors.append("ad_text is required")
    elif len(str(ad_text)) > MAX_TEXT_LENGTH:
        errors.append(f"ad_text must be under {MAX_TEXT_LENGTH} characters")

    try:
        price = float(form.get("price", -1))
        if price < MIN_PRICE or price > MAX_PRICE:
            errors.append(f"price must be between {MIN_PRICE} and {MAX_PRICE}")
    except (TypeError, ValueError):
        errors.append("price must be a number")

    if not str(form.get("channel_id", "")).strip():
        errors.append("channel_id is required")

    return errors


def validate_upload_file(file) -> list:
    errors = []
    if not file or file.filename == "":
        errors.append("No file selected")
        return errors

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)

    if size > MAX_UPLOAD_BYTES:
        errors.append("File size exceeds 10 MB limit")

    mime_type = file.mimetype or ""
    if mime_type not in ALLOWED_MIME_TYPES:
        errors.append(
            f"File type '{mime_type}' is not allowed. "
            f"Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
        )

    return errors
