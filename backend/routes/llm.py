from flask import Blueprint, request, jsonify
import requests
import os
import json as pyjson
import re

llm_bp = Blueprint('llm', __name__)


GOOGLE_SAFE_BROWSING_API_KEY = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY")


def extract_urls(text):
    return re.findall(r'https?://\S+', text)


def check_urls_safe_browsing(urls):
    if not GOOGLE_SAFE_BROWSING_API_KEY:
        return {"error": "Missing API key"}, True

    endpoint = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
    payload = {
        "client": {
            "clientId": "telegram-ad-app",
            "clientVersion": "1.0"
        },
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url} for url in urls]
        }
    }

    try:
        res = requests.post(
            f"{endpoint}?key={GOOGLE_SAFE_BROWSING_API_KEY}",
            json=payload
        )
        res.raise_for_status()
        result = res.json()
        matches = result.get("matches", [])
        malicious_urls = list(set(entry.get("url") for match in matches for entry in match.get("threat", {}).values() if isinstance(entry, dict) and "url" in entry))
        return malicious_urls, len(malicious_urls) > 0
    except Exception as e:
        print("Safe Browsing error:", e)
        return [], False


PROHIBITED_KEYWORDS = {
    "drugs": ["drug", "cocaine", "heroin", "meth", "mdma", "lsd", "weed", "cannabis", "marijuana", "narcotic", "fentanyl"],
    "weapons": ["weapon", "gun", "pistol", "rifle", "explosive", "bomb", "grenade", "firearm", "ammo", "ammunition"],
    "adult": ["pornography", "porn", "xxx", "prostitution", "escort service", "sex for money"],
    "trafficking": ["human trafficking", "trafficking", "slave"],
    "csam": ["child pornography", "child porn", "underage sex", "lolita"],
    "gambling": ["illegal casino", "rigged gambling"],
}


def moderate_text(ad_text):
    urls = extract_urls(ad_text)
    bad_urls, has_bad_links = check_urls_safe_browsing(urls) if urls else ([], False)

    lower_text = ad_text.lower()
    detected_categories = []

    for category, keywords in PROHIBITED_KEYWORDS.items():
        for kw in keywords:
            if kw in lower_text:
                detected_categories.append(category)
                break

    if has_bad_links:
        detected_categories.append("phishing_or_malware")

    contains_prohibited = len(detected_categories) > 0

    return {
        "containsProhibitedContent": contains_prohibited,
        "prohibitedCategories": detected_categories,
        "explanation": (
            f"Detected prohibited content: {', '.join(detected_categories)}"
            if detected_categories
            else "Content appears safe"
        ),
        "unsafeLinks": bad_urls if has_bad_links else [],
    }


@llm_bp.route("/llm", methods=["POST"])
def moderate_ad():
    data = request.get_json()
    ad_text = data.get("text")
    if not ad_text:
        return jsonify({"error": "Missing ad text"}), 400

    result = moderate_text(ad_text)
    return jsonify(result)
