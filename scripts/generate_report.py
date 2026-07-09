import os
import sys
from datetime import datetime
from collections import OrderedDict

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from scripts.parse_excel import parse_all_sheets, analyze_indicators

EXCEL_PATH = "Risco de Integridade - Controle Estatistico PRGA.xlsx"
REPORT_PATH = "relatorio_excel.html"


def fmt(val, decimals=2):
    if val is None:
        return "N/A"
    if isinstance(val, float):
        return f"{val:.{decimals}f}".replace(".", ",")
    return str(val).replace(".", ",")

def fmt_decimal(val):
    if val is None or val == "":
        return ""
    return str(val).replace(".", ",")


def build_html(parsed, analysis):
    now = datetime.now().strftime("%d/%m/%Y %H:%M")

    sheets = parsed["_sheets"]
    var_sheets = [s for s in sheets if s["type"] == "control_chart"]
    other_sheets = [s for s in sheets if s["type"] != "control_chart"]

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório - Risco de Integridade PRGA</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; color: #333; padding: 20px 30px; }}
  h1 {{ color: #003366; border-bottom: 3px solid #003366; padding-bottom: 10px; margin-bottom: 20px; font-size: 1.6em; }}
  h2 {{ color: #003366; margin-top: 30px; padding: 8px 0; border-bottom: 1px solid #ccc; }}
  h3 {{ color: #444; margin: 15px 0 8px; }}
  p {{ margin: 5px 0; }}
  table {{ border-collapse: collapse; margin: 10px 0 20px; width: 100%; max-width: 100%; font-size: 0.85em; }}
  th {{ background: #003366; color: #fff; padding: 6px 10px; text-align: left; font-weight: 600; }}
  td {{ padding: 4px 8px; border: 1px solid #ddd; }}
  tr:nth-child(even) {{ background: #f9f9f9; }}
  hr {{ border: none; border-top: 2px solid #003366; margin: 30px 0; }}
  .resumo {{ background: #e8f0fe; padding: 15px; border-radius: 6px; margin-bottom: 20px; }}
  .resumo p {{ margin: 3px 0; }}
  .badge {{ display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; font-weight: 600; }}
  .badge-var {{ background: #003366; color: #fff; }}
  .badge-other {{ background: #666; color: #fff; }}
  .toc {{ background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 20px; }}
  .toc a {{ color: #003366; text-decoration: none; }}
  .toc a:hover {{ text-decoration: underline; }}
  footer {{ margin-top: 40px; color: #888; font-size: 0.85em; text-align: center; }}
  @media print {{
    body {{ padding: 5px; font-size: 0.8em; }}
    hr {{ page-break-after: always; }}
  }}
</style>
</head>
<body>
"""

    # HEADER
    html += f"""<h1>Relatório de Risco de Integridade — Controle Estatístico PRGA</h1>
<div class="resumo">
<p><strong>Gerado em:</strong> {now}</p>
<p><strong>Arquivo:</strong> {parsed['_workbook']}</p>
<p><strong>Total de Abas:</strong> {len(sheets)} | <strong>Variáveis (V/I):</strong> {len(var_sheets)} | <strong>Outras:</strong> {len(other_sheets)}</p>
</div>
"""

    # TABLE OF CONTENTS
    html += '<div class="toc"><h3>Índice</h3><ul>'
    for i, s in enumerate(var_sheets):
        nome = s["var_name"] or s["name"]
        html += f'<li><a href="#var{i}">{nome}</a></li>'
    html += '</ul></div>'

    # SUMMARY TABLE
    html += """<h2>Resumo Geral das Variáveis</h2>
<table>
<tr><th>Variável</th><th>Descrição</th><th>Período</th><th>Linhas</th><th>Preenchidas</th><th>Vazias</th><th>Mín Soma</th><th>Máx Soma</th><th>Média Soma</th></tr>
"""
    for label, info in analysis.items():
        nome_curto = label[:5] if label else ""
        desc = label[7:].strip() if label and len(label) > 7 else ""
        if len(desc) > 60:
            desc = desc[:60] + "..."
        peri = f"{info.get('periodo_inicio', 'N/A')} a {info.get('periodo_fim', 'N/A')}"
        s_min = fmt(info.get("soma", {}).get("min"), 0) if "soma" in info else "-"
        s_max = fmt(info.get("soma", {}).get("max"), 0) if "soma" in info else "-"
        s_med = fmt(info.get("soma", {}).get("media"), 2) if "soma" in info else "-"
        html += f"<tr><td><strong>{nome_curto}</strong></td><td>{desc}</td><td>{peri}</td><td>{info['total_linhas']}</td><td>{info['preenchidas']}</td><td>{info['vazias']}</td><td>{s_min}</td><td>{s_max}</td><td>{s_med}</td></tr>\n"
    html += "</table>\n<hr>\n"

    # DETAILED SECTIONS
    for idx, s in enumerate(var_sheets):
        nome = s["var_name"] or s["name"]
        nome_curto = nome[:5] if nome else ""
        desc = nome[7:].strip() if nome and len(nome) > 7 else ""

        html += f"""<hr>
<h2 id="var{idx}">{nome_curto} — {desc}</h2>
"""

        stats = s.get("stats", {})
        if any(v is not None for v in stats.values()):
            html += """<h3>Estatísticas do Cabeçalho</h3>
<table>
<tr><th>Métrica</th><th>Soma</th><th>Amplitude</th></tr>
"""
            for metrica, rotulo in [("media", "Média"), ("dp", "Desvio Padrão"), ("max", "Máximo"), ("min", "Mínimo")]:
                s_val = stats.get(f"{metrica}_soma")
                a_val = stats.get(f"{metrica}_amp")
                html += f"<tr><td>{rotulo}</td><td>{fmt(s_val, 2)}</td><td>{fmt(a_val, 2)}</td></tr>\n"
            html += "</table>\n"

        data = s.get("data", [])
        filled_count = sum(1 for d in data if d.get("Soma") is not None and str(d.get("Soma", "")).strip() != "")
        html += f"""<h3>Dados</h3>
<p><strong>Período:</strong> {s.get('periodo_inicio', 'N/A')} a {s.get('periodo_fim', 'N/A')}</p>
<p><strong>{len(data)}</strong> linhas, <strong>{filled_count}</strong> preenchidas, <strong>{len(data) - filled_count}</strong> vazias</p>
"""

        # Analyze filled data
        soma_vals = []
        amp_vals = []
        for d in data:
            try:
                s_v = d.get("Soma")
                if s_v is not None and str(s_v).strip() != "":
                    soma_vals.append(float(str(s_v).replace(",", ".")))
                a_v = d.get("Amplitude")
                if a_v is not None and str(a_v).strip() != "":
                    amp_vals.append(float(str(a_v).replace(",", ".")))
            except:
                pass

        if soma_vals or amp_vals:
            html += """<h3>Análise Estatística</h3>
<table>
<tr><th>Métrica</th><th>Soma</th><th>Amplitude</th></tr>
"""
            html += f"<tr><td>Mínimo</td><td>{fmt(min(soma_vals), 0) if soma_vals else '-'}</td><td>{fmt(min(amp_vals), 2) if amp_vals else '-'}</td></tr>\n"
            html += f"<tr><td>Máximo</td><td>{fmt(max(soma_vals), 0) if soma_vals else '-'}</td><td>{fmt(max(amp_vals), 2) if amp_vals else '-'}</td></tr>\n"
            html += f"<tr><td>Média</td><td>{fmt(sum(soma_vals)/len(soma_vals), 2) if soma_vals else '-'}</td><td>{fmt(sum(amp_vals)/len(amp_vals), 4) if amp_vals else '-'}</td></tr>\n"
            html += "</table>\n"

        # Full data table
        headers = s.get("headers", [])
        html += "<h3>Dados Completos</h3>\n"
        html += "<div style='overflow-x: auto; max-height: 400px; overflow-y: auto;'>\n<table>\n<tr>"
        for h in headers:
            html += f"<th>{h}</th>"
        html += "</tr>\n"
        for d in data:
            html += "<tr>"
            html += f"<td>{d.get('periodo', '')}</td>"
            for h in headers[1:]:
                val = d.get(h, "")
                if isinstance(val, float):
                    html += f"<td>{fmt_decimal(val)}</td>"
                elif val is None or val == "":
                    html += "<td></td>"
                else:
                    html += f"<td>{val}</td>"
            html += "</tr>\n"
        html += "</table>\n</div>\n"

    # OTHER SHEETS
    if other_sheets:
        html += """<hr>
<h2>Outras Abas</h2>
<table>
<tr><th>Aba</th><th>Tipo</th></tr>
"""
        for s in other_sheets:
            html += f"<tr><td>{s['name']}</td><td>{s.get('type', 'desconhecido')}</td></tr>\n"
        html += "</table>\n"

    html += """<hr>
<footer>Relatório gerado automaticamente — CAESB / PRGA</footer>
</body>
</html>"""
    return html


def generate_report():
    if not os.path.exists(EXCEL_PATH):
        print(f"Erro: {EXCEL_PATH} não encontrado.")
        return

    print("Lendo planilha Excel...")
    parsed = parse_all_sheets(EXCEL_PATH)
    analysis = analyze_indicators(parsed)

    print(f"Encontradas {len(parsed['_sheets'])} abas, {len(analysis)} variáveis analisadas.")
    for label, info in analysis.items():
        print(f"  {label[:5]}...: {info['preenchidas']} preenchidas, período {info['periodo_inicio']} a {info['periodo_fim']}")

    print("\nGerando relatório HTML...")
    html = build_html(parsed, analysis)

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\nRelatório salvo: {REPORT_PATH}")
    print(f"Abra no navegador: file://{os.path.abspath(REPORT_PATH)}")


if __name__ == "__main__":
    generate_report()
