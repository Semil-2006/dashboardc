from flask import Blueprint, render_template, jsonify
from app.models import get_dashboard_data

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/api/data")
def api_data():
    data = get_dashboard_data()
    return jsonify(data)
