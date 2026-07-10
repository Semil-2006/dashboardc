import json
import os
from flask import Blueprint, render_template, jsonify, abort
from app.models import get_dashboard_data

main = Blueprint("main", __name__)

RISK_CONFIG_PATH = os.path.join(
    os.path.dirname(__file__), "..", "static", "risk-matrix", "riskConfig.json"
)

INDICATOR_FORMULAS = {
    "I01": lambda v: (v.get("V01", 0) / v.get("V02", 1)) * 100,
    "I02": lambda v: (v.get("V03", 0) / v.get("V02", 1)) * 100,
    "I03": lambda v: (v.get("V04", 0) / v.get("V02", 1)) * 100,
    "I04": lambda v: (v.get("V06", 0) / v.get("V05", 1)) * 100,
    "I05": lambda v: (v.get("V07", 0) / v.get("V08", 1)) * 100,
    "I06": lambda v: (v.get("V09", 0) / v.get("V10", 1)) * 100,
    "I07": lambda v: (v.get("V11", 0) / v.get("V02", 1)) * 100,
    "I08": lambda v: (v.get("V12", 0) / v.get("V02", 1)) * 100,
    "I09": lambda v: (v.get("V13", 0) / v.get("V02", 1)) * 100,
    "I10": lambda v: (v.get("V14", 0) / v.get("V15", 1)) * 100,
}


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/api/data")
def api_data():
    data = get_dashboard_data()
    return jsonify(data)


@main.route("/api/risks")
def api_risks():
    try:
        with open(RISK_CONFIG_PATH, encoding="utf-8") as f:
            config = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return jsonify({"error": "riskConfig.json não encontrado ou inválido"}), 500

    data = get_dashboard_data()
    dashboard = data.get("dashboardData", {})
    years = data.get("YEARS", [])

    causas = []
    for evento_id, evento in config.get("eventos", {}).items():
        for causa in evento.get("causas", []):
            causa_out = {
                "id": causa["id"],
                "nome": causa["nome"],
                "eventoId": evento_id,
                "eventoNome": evento["nome"],
                "indicador": causa.get("indicador"),
                "impacto": causa.get("impacto"),
                "justificativa": causa.get("justificativa", ""),
                "validado": causa.get("validado", False),
                "statusTratamento": causa.get("statusTratamento", "Pendente"),
                "dono": causa.get("dono"),
                "prazo": causa.get("prazo"),
                "planoAcao": causa.get("planoAcao"),
                "reavaliacoes": causa.get("reavaliacoes", []),
                "probabilidade": None,
                "score": None,
                "classificacao": {"cor": "neutro", "rotulo": "Sem dado"},
                "trend": None,
            }

            ind_code = causa.get("indicador")
            if ind_code and ind_code in dashboard:
                ind = dashboard[ind_code]
                series = _build_series(ind_code, ind, dashboard, years)
                all_values = _collect_values(ind, series)
                coletas_min = config.get("thresholds", {}).get(
                    "probabilidade", {}
                ).get("coletasMinimas", 3)

                if len(all_values) < coletas_min:
                    nivel = 2
                    detalhe = (
                        f"Histórico insuficiente ({len(all_values)}/{coletas_min} coletas)"
                    )
                else:
                    avg = sum(all_values) / len(all_values)
                    nivel, detalhe = _calc_probability(
                        avg,
                        ind.get("sentidoBom", "baixo"),
                        ind.get("meta"),
                        ind.get("limiteAceitavel"),
                    )

                trend = _compute_trend(series, ind.get("periodicidade") == "Anual")
                score = nivel * causa["impacto"]

                causa_out["probabilidade"] = {
                    "nivel": nivel,
                    "rotulo": _prob_label(nivel, config),
                    "detalhe": detalhe,
                }
                causa_out["score"] = score
                causa_out["classificacao"] = _classify(score, config)
                causa_out["trend"] = trend
            else:
                causa_out["probabilidade"] = {
                    "nivel": None,
                    "rotulo": "Não calculável",
                    "detalhe": "Sem indicador implantado",
                }

            causas.append(causa_out)

    return jsonify({
        "eventos": config.get("eventos", {}),
        "causas": causas,
        "thresholds": config.get("thresholds", {}),
        "indicadoresSuporte": config.get("indicadoresSuporte", []),
    })


@main.route("/api/indicator/<code>")
def api_indicator(code):
    code = code.upper()
    data = get_dashboard_data()
    dashboard = data.get("dashboardData", {})

    if code not in dashboard:
        abort(404, description=f"Indicador {code} não encontrado")

    ind = dashboard[code]
    years = data.get("YEARS", [])
    quad_st = data.get("quadStatus", {})
    anual_st = data.get("anualStatus", {})

    series = _build_series(code, ind, dashboard, years)

    return jsonify({
        "code": code,
        "name": ind.get("name"),
        "formula": ind.get("formula"),
        "periodicidade": ind.get("periodicidade"),
        "sentidoBom": ind.get("sentidoBom"),
        "meta": ind.get("meta"),
        "limiteAceitavel": ind.get("limiteAceitavel"),
        "vars": {
            vcode: {"label": vobj.get("label"), "data": vobj.get("data")}
            for vcode, vobj in ind.get("vars", {}).items()
        },
        "series": series,
        "quadStatus": quad_st,
        "anualStatus": anual_st,
    })


@main.route("/risk-matrix")
def risk_matrix():
    return render_template("risk_matrix.html")


def _build_series(code, ind, dashboard, years):
    formula = INDICATOR_FORMULAS.get(code)
    is_anual = ind.get("periodicidade") == "Anual"
    series = {}

    if is_anual:
        for year in years:
            if code == "I09":
                v02_data = (
                    dashboard.get("I01", {})
                    .get("vars", {})
                    .get("V02", {})
                    .get("data", {})
                    .get(year)
                )
                v13 = ind.get("vars", {}).get("V13", {}).get("data", {}).get(year)
                if v02_data and all(
                    x is not None for x in v02_data
                ) and v13 is not None:
                    series[year] = round((v13 / sum(v02_data)) * 100, 1)
                else:
                    series[year] = None
            else:
                vars_for_year = {}
                complete = True
                for vcode, vobj in ind.get("vars", {}).items():
                    val = vobj.get("data", {}).get(year)
                    if val is None:
                        complete = False
                    vars_for_year[vcode] = val
                if complete and formula:
                    try:
                        series[year] = round(formula(vars_for_year), 1)
                    except (ZeroDivisionError, TypeError):
                        series[year] = None
                else:
                    series[year] = None
    else:
        for year in years:
            periods = []
            for p in range(3):
                vars_for_period = {}
                complete = True
                for vcode, vobj in ind.get("vars", {}).items():
                    data_year = vobj.get("data", {}).get(year)
                    if isinstance(data_year, list) and p < len(data_year):
                        val = data_year[p]
                    else:
                        val = None
                    if val is None:
                        complete = False
                    vars_for_period[vcode] = val
                if complete and formula:
                    try:
                        periods.append(round(formula(vars_for_period), 1))
                    except (ZeroDivisionError, TypeError):
                        periods.append(None)
                else:
                    periods.append(None)
            series[year] = periods

    return series


def _collect_values(ind, series):
    is_anual = ind.get("periodicidade") == "Anual"
    values = []
    for year_vals in series.values():
        if is_anual:
            if year_vals is not None:
                values.append(year_vals)
        elif isinstance(year_vals, list):
            for v in year_vals:
                if v is not None:
                    values.append(v)
    return values


def _calc_probability(avg, sentido_bom, meta, limite):
    if sentido_bom == "baixo":
        if meta is not None and avg <= meta:
            return 1, f"Valor ({round(avg, 1)}%) dentro da meta"
        if limite is not None and avg <= limite:
            return 2, f"Valor ({round(avg, 1)}%) na faixa aceitável"
        return 3, f"Valor ({round(avg, 1)}%) acima do limite aceitável"
    else:
        if meta is not None and avg >= meta:
            return 1, f"Valor ({round(avg, 1)}%) dentro da meta"
        if limite is not None and avg >= limite:
            return 2, f"Valor ({round(avg, 1)}%) na faixa aceitável"
        return 3, f"Valor ({round(avg, 1)}%) abaixo do limite aceitável"


def _compute_trend(series, is_anual):
    values = []
    for year_vals in series.values():
        if is_anual:
            if year_vals is not None:
                values.append(year_vals)
        elif isinstance(year_vals, list):
            for v in year_vals:
                if v is not None:
                    values.append(v)
    if len(values) < 2:
        return "\u2192"
    mid = len(values) // 2
    avg1 = sum(values[:mid]) / mid
    avg2 = sum(values[mid:]) / (len(values) - mid)
    diff = avg2 - avg1
    threshold = avg1 * 0.05
    if diff > threshold:
        return "\u2191"
    if diff < -threshold:
        return "\u2193"
    return "\u2192"


def _prob_label(nivel, config):
    niveis = config.get("thresholds", {}).get("probabilidade", {}).get("niveis", [])
    for n in niveis:
        if n["nivel"] == nivel:
            return n["rotulo"]
    return "Média"


def _classify(score, config):
    faixas = config.get("thresholds", {}).get("score", {}).get("faixas", [])
    for faixa in faixas:
        if faixa["min"] <= score <= faixa["max"]:
            return {"cor": faixa["cor"], "rotulo": faixa["rotulo"]}
    return {"cor": "neutro", "rotulo": "Indefinido"}
