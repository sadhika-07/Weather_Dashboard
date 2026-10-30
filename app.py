
from flask import Flask, jsonify
from dotenv import load_dotenv

from routes.current_weather import current_weather_bp
from routes.forecast import forecast_bp
from favorites_create import favorites_create_bp
from favorites_read import favorites_read_bp
from favorites_update import favorites_update_bp
from favorites_delete import favorites_delete_bp
from flask import Flask, jsonify, render_template

load_dotenv()

app = Flask(__name__)

# Register all API blueprints
app.register_blueprint(current_weather_bp)
app.register_blueprint(forecast_bp)
app.register_blueprint(favorites_create_bp)
app.register_blueprint(favorites_read_bp)
app.register_blueprint(favorites_update_bp)
app.register_blueprint(favorites_delete_bp)


# Consistent error responses
@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        "success": False,
        "error": "Invalid request"
    }), 400

@app.route("/")
def home():
    return render_template("index.html")

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "success": False,
        "error": "HTTP method not allowed"
    }), 405


@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "success": True,
        "status": "healthy"
    }), 200


if __name__ == "__main__":
    app.run(debug=True)
