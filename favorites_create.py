
from flask import Blueprint, jsonify, request
from mysql.connector import Error, IntegrityError
from database import get_db_connection

favorites_create_bp = Blueprint("favorites_create", __name__)


@favorites_create_bp.route("/api/favorites", methods=["POST"])
def create_favorite():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    city = data.get("city")
    country = data.get("country")
    nickname = data.get("nickname")

    if not isinstance(city, str) or not city.strip():
        return jsonify({"error": "City is required"}), 400

    if not isinstance(country, str) or not country.strip():
        return jsonify({"error": "Country is required"}), 400

    if nickname is not None and not isinstance(nickname, str):
        return jsonify({"error": "Nickname must be a string"}), 400

    city = city.strip()
    country = country.strip()
    nickname = nickname.strip() if nickname else None

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            INSERT INTO favorites (city, country, nickname)
            VALUES (%s, %s, %s)
            """,
            (city, country, nickname)
        )
        connection.commit()
        favorite_id = cursor.lastrowid

        cursor.execute(
            """
            SELECT id, city, country, nickname, created_at
            FROM favorites WHERE id = %s
            """,
            (favorite_id,)
        )
        favorite = cursor.fetchone()

        if favorite and favorite["created_at"]:
            favorite["created_at"] = favorite["created_at"].isoformat(sep=" ")

        return jsonify({
            "message": "Favorite city created successfully",
            "favorite": favorite
        }), 201

    except IntegrityError as error:
        if connection and connection.is_connected():
            connection.rollback()

        if error.errno == 1062:
            return jsonify({
                "error": "This city and country are already in favorites"
            }), 409

        return jsonify({"error": "Database integrity error"}), 500

    except Error:
        if connection and connection.is_connected():
            connection.rollback()
        return jsonify({"error": "Database operation failed"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
