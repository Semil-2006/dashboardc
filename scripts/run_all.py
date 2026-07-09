#!/usr/bin/env python3
"""
Orquestrador Completo:
1. Download do Excel via cookies do Chrome autenticado
2. Parse de todas as abas (V01-V15, I05-I06, painéis)
3. Geração de relatório HTML detalhado
4. Geração de JSON com análise completa

Uso:  venv/bin/python scripts/run_all.py
"""

import os
import sys
import json
from datetime import datetime

SCRIPTS_DIR = os.path.dirname(__file__)
BASE_DIR = os.path.dirname(SCRIPTS_DIR)
sys.path.insert(0, BASE_DIR)
EXCEL_PATH = os.path.join(BASE_DIR, "Risco de Integridade - Controle Estatistico PRGA.xlsx")


def step(msg):
    print(f"\n{'='*70}")
    print(f"  {msg}")
    print(f"{'='*70}")


def main():
    t0 = datetime.now()

    step("1/3: Baixando Excel do SharePoint via cookies do Chrome")
    from scripts.download_excel import download_excel, OUTPUT_PATH
    result = download_excel()
    if not result or not os.path.exists(result) or os.path.getsize(result) < 5000:
        print("AVISO: Download falhou ou arquivo inválido. Usando arquivo local existente como fallback.")
        result = OUTPUT_PATH
        if not os.path.exists(result) or os.path.getsize(result) < 5000:
            print("ERRO: Arquivo local do Excel não encontrado ou inválido.")
            sys.exit(1)
    print(f"Arquivo: {result} ({os.path.getsize(result)} bytes)")

    step("2/3: Parseando planilha Excel")
    from scripts.parse_excel import parse_all_sheets, analyze_indicators

    parsed = parse_all_sheets(EXCEL_PATH)
    analysis = analyze_indicators(parsed)

    print(f"Total de abas: {len(parsed['_sheets'])}")
    for s in parsed["_sheets"]:
        nome = s["var_name"] or s["name"]
        tipo = s["type"]
        dados = len(s.get("data", []))
        print(f"  [{tipo:>15s}] {nome}: {dados} linhas")

    json_path = os.path.join(BASE_DIR, "analise_excel.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2, default=str, ensure_ascii=False)
    print(f"\nAnálise JSON salva: {json_path}")

    step("3/3: Gerando relatório HTML")
    from scripts.generate_report import build_html

    html = build_html(parsed, analysis)

    report_path = os.path.join(BASE_DIR, "relatorio_excel.html")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Relatório HTML salvo: {report_path}")

    elapsed = (datetime.now() - t0).total_seconds()
    print(f"\n{'='*70}")
    print(f"  PROCESSO CONCLUÍDO EM {elapsed:.1f}s!")
    print(f"\n  Para visualizar:")
    print(f"    Relatório: file://{report_path}")
    print(f"    JSON:      {json_path}")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
