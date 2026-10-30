
import requests
from flask import Blueprint, jsonify, request
from config import Config

forecast_bp = Blueprint("forecast", __name__)

BASE_URL = "https://api.openweathermap.org/data/2.5"


@forecast_bp.route("/api/weather/forecast", methods=["GET"])
def get_forecast():
    city = request.args.get("city", "").strip()

    if not city:
        return jsonify({"error": "City name is required"}), 400

    if not Config.OPENWEATHER_API_KEY:
        return jsonify({"error": "Weather service is not configured"}), 503

    try:
        response = requests.get(
            f"{BASE_URL}/forecast",
            params={
                "q": city,
                "appid": Config.OPENWEATHER_API_KEY,
                "units": "metric"
            },
            timeout=10
        )

        if response.status_code == 401:
            return jsonify({"error": "Weather service authentication failed"}), 502

        if response.status_code == 404:
            return jsonify({"error": "City not found"}), 404

        if response.status_code == 429:
            return jsonify({"error": "Weather service rate limit reached"}), 503

        if response.status_code != 200:
            return jsonify({"error": "Weather service request failed"}), 502

        data = response.json()
        daily = {}

        for item in data.get("list", []):
            date = item["dt_txt"].split(" ")[0]

            if date not in daily:
                daily[date] = {
                    "date": date,
                    "min_temp": item["main"]["temp_min"],
                    "max_temp": item["main"]["temp_max"],
                    "conditions": item["weather"][0]["description"]
                }
            else:
                daily[date]["min_temp"] = min(
                    daily[date]["min_temp"],
                    item["main"]["temp_min"]
                )
                daily[date]["max_temp"] = max(
                    daily[date]["max_temp"],
                    item["main"]["temp_max"]
                )

        return jsonify({
            "city": data["city"]["name"],
            "country": data["city"]["country"],
            "forecast": list(daily.values())[:5]
        }), 200

    except requests.Timeout:
        return jsonify({"error": "Weather service request timed out"}), 504

    except requests.RequestException:
        return jsonify({"error": "Weather service is unavailable"}), 502

    except (KeyError, ValueError, TypeError):
        return jsonify({"error": "Invalid response from weather service"}), 502
