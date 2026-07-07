from flask import Blueprint, render_template, jsonify
from app.models.models import (
    YEARS, dashboardData, quadStatus, anualStatus,
    integrityPairs, yearColors
)

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/api/data")
def api_data():
    return jsonify({
        "YEARS": YEARS,
        "dashboardData": dashboardData,
        "quadStatus": quadStatus,
        "anualStatus": anualStatus,
        "integrityPairs": integrityPairs,
        "yearColors": yearColors,
    })
