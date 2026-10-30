
import requests
from flask import Blueprint, jsonify, request
from config import Config

current_weather_bp = Blueprint("current_weather", __name__)

BASE_URL = "https://api.openweathermap.org/data/2.5"


@current_weather_bp.route("/api/weather/current", methods=["GET"])
def get_current_weather():
    city = request.args.get("city", "").strip()

    if not city:
        return jsonify({"error": "City name is required"}), 400

    if not Config.OPENWEATHER_API_KEY:
        return jsonify({"error": "Weather service is not configured"}), 503

    try:
        response = requests.get(
            f"{BASE_URL}/weather",
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

        
        return jsonify({
            "city": data["name"],
            "country": data["sys"]["country"],
            "temperature": data["main"]["temp"],
            "feels_like": data["main"]["feels_like"],
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "wind_speed": data["wind"]["speed"],
            "visibility": data.get("visibility"),
            "weather": data["weather"][0]["description"]
        }), 200


    except requests.Timeout:
        return jsonify({"error": "Weather service request timed out"}), 504

    except requests.RequestException:
        return jsonify({"error": "Weather service is unavailable"}), 502

    except (KeyError, ValueError, TypeError):
        return jsonify({"error": "Invalid response from weather service"}), 502
