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


def moderate_text(ad_text):
    urls = extract_urls(ad_text)
    bad_urls, has_bad_links = check_urls_safe_browsing(urls) if urls else ([], False)

    prompt = (
        "Analyze the following advertisement text and determine if it contains any prohibited content.\n"
        "Categories to detect include: drugs, human trafficking, prostitution, pornography, child pornography,\n"
        "weapons, violence, hate speech, or other illegal or unethical content.\n\n"
        "Respond strictly in JSON format with:\n"
        "{\n"
        '  "containsProhibitedContent": boolean,\n'
        '  "prohibitedCategories": ["..."],\n'
        '  "explanation": "..." \n'
        "}\n\n"
        f"Advertisement:\n\"\"\"\n{ad_text}\n\"\"\""
    )

    try:
        response = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json={
                "model": "deepseek-r1",
                "prompt": prompt,
                "stream": False
            }
        )
        response.raise_for_status()
        result = response.json()

        raw_output = result.get("response", "{}").strip()
        start = raw_output.find("{")
        end = raw_output.rfind("}") + 1
        cleaned_json = raw_output[start:end]

        parsed = pyjson.loads(cleaned_json)

        if has_bad_links:
            parsed["containsProhibitedContent"] = True
            parsed.setdefault("prohibitedCategories", []).append("phishing_or_malware")
            parsed["unsafeLinks"] = bad_urls

        return parsed

    except Exception as e:
        print("LLM moderation failed:", e)
        return {
            "containsProhibitedContent": True,
            "prohibitedCategories": ["moderation_failed"],
            "explanation": f"Moderation failed: {str(e)}"
        }


@llm_bp.route("/llm", methods=["POST"])
def moderate_ad():
    data = request.get_json()
    ad_text = data.get("text")
    if not ad_text:
        return jsonify({"error": "Missing ad text"}), 400

    result = moderate_text(ad_text)
    return jsonify(result)
