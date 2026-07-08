# Contexto do Projeto — Dashboard de Riscos de Integridade (CAESB)

## Visão Geral

Dashboard corporativo estilo Power BI para monitoramento de **10 indicadores de integridade e compliance** da CAESB (Companhia de Saneamento Ambiental do Distrito Federal). Acompanha métricas como denúncias de assédio, nepotismo, conflito de interesses, efetividade de apuração, treinamento em compliance, entre outros.

Os dados são lidos em **tempo real** de uma planilha Excel hospedada no **SharePoint Corporativo** da CAESB, com cache de 5 minutos e fallback para dados hardcoded quando o Excel não está disponível (sem conexão, cookie expirado, etc.).

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.12 + Flask 3.1 |
| Frontend | HTML5 + CSS3 (vanilla) + JavaScript ES6 (vanilla) |
| Templates | Jinja2 |
| Excel | openpyxl (leitura), SharePoint Online (download) |
| Autenticação SharePoint | browser-cookie3 (cookies Chrome) + Forms-Based Auth (EAR JWE) |
| Testes JS | Jest 30 + jsdom |
| Testes Python | pytest + pytest-cov |

## Dependências (Python)

```
Flask>=3.1
requests
openpyxl
browser-cookie3
pytest
pytest-cov
```

## Dependências (Node)

```json
{
  "devDependencies": {
    "jest": "^30.4.2",
    "jest-environment-jsdom": "^30.4.1"
  }
}
```

## Estrutura do Projeto

```
dashboardc/
├── run.py                                    # Entry point do servidor Flask (dev)
├── CONTEXT.md                                # Este arquivo — documentação completa
├── package.json                              # Dependências Node (Jest)
├── .excel_cache.xlsx                         # Cache do Excel baixado (auto-gerado)
├── .data_cache.json                          # Cache JSON processado (auto-gerado)
├── Risco de Integridade - Controle Estatistico PRGA.xlsx  # Download manual (opcional)
│
├── app/
│   ├── __init__.py              # Flask app factory: create_app(), Blueprint main
│   ├── routes.py                # Rotas: / (index) e /api/data (JSON API)
│   │
│   └── models/
│       ├── __init__.py          # Fachada unificada: get_dashboard_data()
│       ├── default_data.py      # Fallback hardcoded (dados estáticos)
│       └── excel_provider.py    # Leitor do Excel SharePoint com cache
│
├── static/
│   ├── css/
│   │   └── style.css            # 944 linhas, design Power BI
│   │
│   └── js/
│       ├── model.js             # Model (lógica de negócio, fórmulas, séries)
│       ├── view.js              # View (renderização DOM, SVG, tabelas)
│       ├── controller.js        # Controller (eventos, toolbar, export CSV)
│       │
│       └── __tests__/
│           ├── model.test.js    # Testes Jest do model
│           ├── view.test.js     # Testes Jest da view
│           ├── controller.test.js  # Testes Jest do controller
│           └── helpers.js       # Dados mock para os testes
│
├── templates/
│   └── index.html               # Template Jinja2 (135 linhas)
│
├── scripts/
│   ├── download_excel.py        # Script autônomo de download do Excel
│   ├── parse_excel.py           # Parser detalhado (estatísticas, relatório)
│   ├── generate_report.py       # Gera relatório HTML a partir do parse
│   └── run_all.py               # Orquestrador: download → parse → relatório
│
└── tests/
    ├── conftest.py              # Fixtures pytest (app, client)
    ├── test_app.py              # Testes da app factory (2 testes)
    ├── test_models.py           # Testes dos dados hardcoded (17 testes)
    └── test_routes.py           # Testes das rotas Flask (5 testes)
```

---

## ARQUITETURA BACKEND

### `run.py` (8 linhas)

**Responsabilidade:** Entry point do servidor de desenvolvimento.

```python
from app import create_app
app = create_app()
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
```

- Cria a app Flask via factory.
- Porta padrão 5000, configurável via env `PORT`.
- Modo debug ativado.

---

### `app/__init__.py` (7 linhas)

**Responsabilidade:** App factory do Flask.

```python
from flask import Flask
def create_app():
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    from app.routes import main
    app.register_blueprint(main)
    return app
```

- Cria instância Flask com pastas `templates/` e `static/` na raiz.
- Registra Blueprint `main` de `app/routes.py`.

---

### `app/routes.py` (13 linhas)

**Responsabilidade:** Rotas HTTP. Controlador MVC.

```python
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
```

| Rota | Método | Retorno | Descrição |
|---|---|---|---|
| `/` | GET | HTML | Página principal do dashboard |
| `/api/data` | GET | JSON | Dados completos (indicadores, vars, status, cores) |

- `/api/data` retorna um JSON com ~15-20 KB, contendo todos os 10 indicadores.
- A resposta NÃO é cacheada pelo Flask (sem `Cache-Control`), mas o `get_dashboard_data()` tem cache interno de 5 min.

---

### `app/models/__init__.py` (38 linhas)

**Responsabilidade:** Fachada unificada de acesso aos dados. Ponto único de entrada.

```python
import copy
from app.models.default_data import (
    YEARS, dashboardData as fallbackData, quadStatus as fallbackQuadStatus,
    anualStatus as fallbackAnualStatus, formulas, integrityPairs, yearColors
)
from app.models.excel_provider import get_dashboard_data as _excel_data

_use_live = True
_dashboard_cache = None

def get_dashboard_data(force_reload=False):
    global _dashboard_cache
    if force_reload:
        _dashboard_cache = None
    if _dashboard_cache is not None:
        return _dashboard_cache
    if _use_live:
        try:
            live = _excel_data()
            if live:
                _dashboard_cache = live
                return _dashboard_cache
        except Exception:
            pass
    _dashboard_cache = _build_fallback()
    return _dashboard_cache

def _build_fallback():
    return {
        "YEARS": YEARS,
        "dashboardData": copy.deepcopy(fallbackData),
        "quadStatus": copy.deepcopy(fallbackQuadStatus),
        "anualStatus": copy.deepcopy(fallbackAnualStatus),
        "integrityPairs": integrityPairs,
        "yearColors": yearColors,
    }
```

**Fluxo:**
1. Se existe cache em memória (`_dashboard_cache`), retorna.
2. Se `_use_live == True`, tenta `excel_provider.get_dashboard_data()`:
   - Se retornar dados, salva em cache e retorna.
   - Se lançar exceção, silencia e vai para fallback.
3. Fallback: constrói resposta a partir de `default_data.py` (cópia profunda para evitar mutação).

---

### `app/models/default_data.py` (84 linhas)

**Responsabilidade:** Dados hardcoded de fallback, usados quando o Excel não está disponível.

**Conteúdo:**

| Constante | Tipo | Descrição |
|---|---|---|
| `YEARS` | `list[str]` | `["2023", "2024", "2025", "2026"]` |
| `quadStatus` | `dict` | Status de cada quadrimestre: `{"2023": ["completo","completo","completo"], "2026": ["completo","parcial","pendente"]}` |
| `anualStatus` | `dict` | Status anual: `{"2023": "completo", "2026": "pendente"}` |
| `dashboardData` | `dict` | 10 indicadores I01-I10 (ver estrutura abaixo) |
| `formulas` | `dict` | Strings de fórmula: `{"I01": "(V01 / V02) * 100", ...}` |
| `integrityPairs` | `dict` | Pares numerador/denominador: `{"I01": ["V01", "V02"], ...}` |
| `yearColors` | `dict` | Cores CSS por ano: `{"2023": "#cccccc", "2024": "var(--navy)", "2025": "var(--sky)", "2026": "#333333"}` |

**Estrutura de cada indicador em `dashboardData`:**

```python
"I01": {
    "name": "Percentual de denúncias de assédio moral",
    "formula": "(V01 / V02) × 100",
    "periodicidade": "Quadrimestral",     # ou "Anual"
    "granularidade": "Mensal, com consolidação quadrimestral",
    "sentidoBom": "baixo",                 # "alto" = quanto maior melhor
    "coletasValidas": 39,                  # número de quadrimestres com dados
    "meta": 20,                            # percentual
    "limiteAceitavel": 30,
    "observacao": None,                    # ou string
    "vars": {
        "V01": {
            "label": "Denúncias de assédio moral",
            "data": {
                "2023": [6, 7, 7],         # quadrimestral: array de 3
                "2024": [7, 6, 7],
                "2025": [5, 5, 4],
                "2026": [3, 3, None]
            }
        },
        "V02": {
            "label": "Total de denúncias",
            "data": {
                "2023": [15, 18, 20],
                ...
            }
        }
    }
}
```

**Indicadores anuais** usam valor único em vez de array:
```python
"V05": {"label": "Contratos enviados à CGDF", "data": {"2023": 40, "2024": 55, "2025": 60, "2026": None}}
```

**Observações sobre os fallbacks:**
- I04 (Lei 6.112/2018): V05 e V06 não existem na planilha → retorna constantemente `None`
- I03 (Efetividade): V04 = V02 → 100% constante
- I10 (Penalidade): V14 = V15 → 100% constante

---

### `app/models/excel_provider.py` (~270 linhas)

**Responsabilidade:** Provedor de dados ao vivo a partir do Excel no SharePoint. Gerencia download, cache, parse e agregação.

#### Constantes

| Constante | Valor | Descrição |
|---|---|---|
| `SHAREPOINT_URL` | URL completa do SharePoint com `sourcedoc=%7BD33B7D0A-8470-4A52-8C4E-03F30ACC8731%7D` | Aponta para o arquivo no site PRGC2 |
| `EXCEL_CACHE` | `.excel_cache.xlsx` (raiz) | Cache do binário Excel baixado |
| `DATA_CACHE` | `.data_cache.json` (raiz) | Cache do JSON processado |
| `CACHE_TTL` | 300 segundos (5 min) | Tempo de vida dos caches |
| `VAR_LABELS` | `dict` V01-V15 → rótulos | Descrições em português |
| `FORMULAS` | `dict` I01-I10 → `(num, den)` | Pares numerador/denominador |
| `QUAD_INDICATORS` | `{I01, I02, I03, I07, I08}` | Indicadores quadrimestrais |
| `ANUAL_INDICATORS` | `{I04, I05, I06, I09, I10}` | Indicadores anuais |

#### Funções

| Função | Descrição |
|---|---|
| `month_to_quad(m)` | Mapeia mês 1-12 para quadrimestre 0/1/2 |
| `_parse_num(val)` | Converte valor para float, tratando `,` como decimal |
| `_extract_year_month(cell)` | Extrai (ano, mês) de datetime ou string "YYYY.MM" |
| `_chrome_cookies()` | Extrai cookies do Chrome para 4 domínios do SharePoint/Microsoft |
| `_download_excel()` | Faz download do Excel via SharePoint, seguindo chain Forms-Based Auth (EAR JWE) se necessário |
| `_parse_sheet(ws)` | Parseia uma aba V-sheet: procura "Período", extrai pares (mês → soma) |
| `_load_excel(path)` | Carrega workbook, filtra abas V01-V15, retorna `{vid: {year: {month: val}}}` |
| `_agg_quad(monthly)` | Agrega dados mensais para quadrimestrais (soma por quadrimestre) |
| `_agg_anual(monthly)` | Agrega dados mensais para anuais (soma do ano) |
| `get_dashboard_data()` | Função principal: verifica cache → Excel → constrói resposta |
| `_cache_valid(path, ttl=300)` | Verifica se arquivo de cache existe e está dentro do TTL |
| `_build_from_excel(path)` | Constrói dict completo do dashboard a partir do Excel parseado |
| `_indicator_meta(code)` | Busca metadados do indicador no fallback |

#### Fluxo de Download (`_download_excel`)

```
1. Extrai UniqueId da URL (sourcedoc parameter)
2. Monta URL de download: download.aspx?UniqueId={uid}
3. Loop (até 6 iterações):
   a. GET na URL de download
   b. Se Content-Type for application/vnd* ou tamanho > 50KB → sucesso, salva cache
   c. Se encontrar formulário EAR (ear_jwe) → POST para _forms/default.aspx
   d. Repete
4. Pós-loop: último GET tentativa na download URL
```

#### Fluxo de Parse (`_build_from_excel`)

```
1. _load_excel(path):
   - Abre workbook com openpyxl
   - Itera abas, filtra por regex r"V\d{2}" (V01-V15)
   - _parse_sheet() para cada:
     a. Encontra linha "Período" (col A)
     b. Lê rows abaixo, extrai (year, month) de col A, valor de col B
     c. Ignora valores onde col B == "soma" (string literal)
     d. Retorna {year: {month: value}}

2. Agregação:
   - _agg_quad(): {year: [q1, q2, q3]} — soma mensal por quadrimestre
   - _agg_anual(): {year: total_anual}

3. Status (baseado em V02):
   - Quadrimestral: v>0 → "completo", v!=None → "parcial", else "pendente"
   - Anual: v truthy → "completo", else "pendente"

4. Montagem dos indicadores:
   - Para cada I01-I10:
     a. Obtém metadados do fallback
     b. Define coletasValidas = q_count (para quadrimestrais)
     c. Monta vars com labels + dados agregados
     d. I09 recebe V02 extra (de I01) como denominador externo

5. Salva JSON em DATA_CACHE
```

#### Estrutura de Retorno

```python
{
    "YEARS": ["2023", "2024", "2025", "2026"],
    "dashboardData": {
        "I01": {
            "name": "Percentual de denúncias de assédio moral",
            "formula": "(V01 / V02) × 100",
            "periodicidade": "Quadrimestral",
            "granularidade": "Mensal, com consolidação quadrimestral",
            "sentidoBom": "baixo",
            "coletasValidas": 39,
            "meta": 20,
            "limiteAceitavel": 30,
            "observacao": None,
            "vars": {
                "V01": {"label": "...", "data": {"2023": [q1,q2,q3], ...}},
                "V02": {"label": "...", "data": {"2023": [q1,q2,q3], ...}},
            }
        },
        # I02-I08 (quadrimestrais, mesma estrutura)
        # I04-I06, I09-I10 (anuais, valores únicos)
    },
    "quadStatus": {
        "2023": ["completo", "completo", "completo"],
        "2026": ["completo", "parcial", "pendente"]
    },
    "anualStatus": {
        "2023": "completo",
        "2026": "pendente"
    },
    "integrityPairs": {...},
    "yearColors": {...}
}
```

---

## PLANILHA EXCEL — ESTRUTURA COMPLETA

**Arquivo:** `Risco de Integridade - Controle Estatistico PRGA.xlsx`
**Localização:** SharePoint CAESB → PRGC2 → Documentos Compartilhados
**UniqueId:** `d33b7d0a-8470-4a52-8c4e-03f30acc8731`
**Total de abas:** 19

### Abas de Dados (Variáveis)

Cada aba V-sheet é um gráfico de controle estatístico com:

| Linhas | Conteúdo |
|---|---|
| 1-4 | Cabeçalho estatístico (Média, Desvio Padrão, Máximo, Mínimo) da Soma Móvel e Amplitude Móvel |
| 5 | Título descritivo (ex: "V01 - NÚMERO DE DENÚNCIAS DE ASSÉDIO MORAL APURADA") |
| 6 | (vazia) |
| 7 | "DADOS" header |
| 8 | Headers das colunas: Período, Soma, Amplitude, LIC, LMC, LSC, ... |
| 9+ | Linhas de dados mensais |

#### V01 — Denúncias de Assédio Moral
- **Dimensões:** A1:Q96, 96 linhas × 17 colunas
- **Conteúdo:** Dados mensais set/2022 a dez/2029 (2022-09 a 2029-12)
- **Linhas com dados:** set/2022 a nov/2025 (primeiras ~38 linhas preenchidas)
- **Linhas futuras:** dez/2025 a dez/2029 (vazias, None)
- **Headers:** Período (datetime), Soma (float), Amplitude (float), LIC, LMC, LSC, ...
- **Estatísticas:** Média=3.92, DP=2.46, Máx=9, Mín=0

#### V02 — Total de Denúncias
- **Dimensões:** A1:Q96, 96 × 17
- **Estrutura:** Idêntica a V01
- **Estatísticas:** Média=57.63, DP=18.62, Máx=103, Mín=16

#### V03 — Denúncias de Assédio Sexual
- **Dimensões:** A1:Q96, 96 × 17
- **Estatísticas:** Média=1.42, DP=1.03, Máx=4, Mín=0

#### V04 — Denúncias Apuradas e Tratadas
- **Dimensões:** A1:Q96, 96 × 17
- **Estatísticas:** IDÊNTICAS a V02 (Média=57.63, DP=18.62, Máx=103, Mín=16)
- **Observação:** Na planilha real, V04 = V02 (mesmos valores), resultando em I03 = 100%

#### V07 — Empregados Treinados (PRGA)
- **Dimensões:** A1:Q60, 60 × 17
- **Formato:** Período em string "YYYY.MM" em vez de datetime
- **Dados:** Apenas 7 linhas preenchidas (2022.03, 2023.01-03, 2024.01-03)
- **Estatísticas:** Média=52.14, DP=52.15, Máx=124, Mín=0
- **Dados:**
  | Período | Soma |
  |---|---|
  | 2022.03 | 0 |
  | 2023.01 | 80 |
  | 2023.02 | 98 |
  | 2023.03 | 0 |
  | 2024.01 | 0 |
  | 2024.02 | 124 |
  | 2024.03 | 63 |

#### V08 — Total de Empregados
- **Dimensões:** A1:Q60, 60 × 17
- **Estatísticas:** Média=41.14, DP=41.83, Máx=106, Mín=0
- **Dados (7 linhas):**
  | Período | Soma |
  |---|---|
  | 2022.03 | 0 |
  | 2023.01 | 54 |
  | 2023.02 | 65 |
  | 2023.03 | 0 |
  | 2024.01 | 0 |
  | 2024.02 | 106 |
  | 2024.03 | 63 |

#### V09 — Evasão no Treinamento
- **Dimensões:** A1:Q60, 60 × 17
- **Estatísticas:** Média=3.86, DP=6.49, Máx=16, Mín=0
- **Dados (7 linhas):**
  | Período | Soma |
  |---|---|
  | 2022.03 | 0 |
  | 2023.01 | 16 |
  | 2023.02 | 10 |
  | 2023.03 | 0 |
  | 2024.01 | 0 |
  | 2024.02 | 1 |
  | 2024.03 | 0 |

#### V10 — Vagas Ofertadas
- **Dimensões:** A1:Q60, 60 × 17
- **Estatísticas:** Média=56, DP=55.56, Máx=125, Mín=0
- **Dados (7 linhas):**
  | Período | Soma |
  |---|---|
  | 2022.03 | 0 |
  | 2023.01 | 96 |
  | 2023.02 | 108 |
  | 2023.03 | 0 |
  | 2024.01 | 0 |
  | 2024.02 | 125 |
  | 2024.03 | 63 |

#### V11 — Denúncias de Nepotismo
- **Dimensões:** A1:Q96, 96 × 17
- **Estatísticas:** Média=2.16, DP=1.72, Máx=6, Mín=0

#### V12 — Denúncias de Conflito de Interesses
- **Dimensões:** A1:Q96, 96 × 17
- **Estatísticas:** Média=0.32, DP=0.47, Máx=1, Mín=0

#### V13 — Denúncias Procedentes
- **Dimensões:** A1:Q96, 96 × 17
- **Estatísticas:** Média=15.37, DP=6.84, Máx=30, Mín=2

#### V14 — Denúncias com Penalidade
- **Dimensões:** A1:Q96, 96 × 17
- **Estatísticas:** Média=15.05, DP=6.33, Máx=27, Mín=2

#### V15 — Denúncias Enviadas às Comissões
- **Dimensões:** A1:Q96, 96 × 17
- **Estatísticas:** IDÊNTICAS a V14 (Média=15.05, DP=6.33, Máx=27, Mín=2)
- **Observação:** V14 = V15 → I10 = 100%

### Abas de Indicadores Calculados

#### I05 — Percentual de Empregados Treinados
- **Dimensões:** A1:R60, 60 × 18
- **Headers:** Período, V07, V08, I05, LIC, ...
- **Dados (7 linhas):**
  | Período | V07 | V08 | I05 (%) |
  |---|---|---|---|
  | 2022.03 | 0 | 0 | None |
  | 2023.01 | 80 | 54 | 148.15 |
  | 2023.02 | 98 | 65 | 150.77 |
  | 2023.03 | 0 | 0 | None |
  | 2024.01 | 0 | 0 | None |
  | 2024.02 | 124 | 106 | 116.98 |
  | 2024.03 | 63 | 63 | 100.00 |

#### I06 — Percentual de Evasão
- **Dimensões:** A1:R60, 60 × 18
- **Headers:** Período, V09, V10, I06, LIC, ...
- **Dados (7 linhas):**
  | Período | V09 | V10 | I06 (%) |
  |---|---|---|---|
  | 2022.03 | 0 | 0 | None |
  | 2023.01 | 16 | 96 | 16.67 |
  | 2023.02 | 10 | 108 | 9.26 |
  | 2023.03 | 0 | 0 | None |
  | 2024.01 | 0 | 0 | None |
  | 2024.02 | 1 | 125 | 0.80 |
  | 2024.03 | 0 | 63 | 0.00 |

### Abas de Catálogo e Painéis

#### Catalogo de Variaveis
- **Dimensões:** A1:U65, 65 linhas × 21 colunas
- **Headings (linha 5):** Ano, Bim, Trim, Quad, Sem, PERIODO, V01, V02, V03, V04, V05, V06, V07, V08, V09, V10, V11, V12, V13, V14, V15
- **Linhas 1-4:** Estatísticas (Média, DP, Máx, Mín) para V01-V04, V07-V10
- **Linha 6-65:** Dados mensais de 2022-01 a 2026-12 para TODAS as variáveis V01-V15
- **V05 e V06:** Preenchidas apenas em 2025 no catálogo (valores 4-33), NÃO têm abas individuais

#### PainelDeVariaveis
- **Dimensões:** A1:AY556, 556 linhas × 51 colunas
- Painel consolidado com dados de todas as variáveis V01-V15 em sequência
- Cada variável repete cabeçalho (PERÍODO, LMC, VMC, LME, VME) seguido de tabelas de Soma Móvel + Amplitude Móvel

#### PainelDeIndicadores
- **Dimensões:** M2:N19, 19 linhas × 14 colunas (apenas M2:N4 com conteúdo)
- Notas de texto:
  1. "A princípio foi mantida a proposta inicial de apuração quadrimestral"
  2. "Aparentemente o processo de treinamento não apresenta recorrência"
  3. "A base de dados é insuficiente para realização de análise"

#### Planilha1
- Vazia (A1 apenas)

### Resumo: Abas que NÃO Existem

| Aba | Status | Motivo |
|---|---|---|
| V05 | ❌ Não existe | Dados apenas no Catalogo (coluna 11) |
| V06 | ❌ Não existe | Dados apenas no Catalogo (coluna 12) |
| I01 | ❌ Não existe | Calculado pelo código (V01/V02) |
| I02 | ❌ Não existe | Calculado pelo código (V03/V02) |
| I03 | ❌ Não existe | Calculado pelo código (V04/V02) |
| I04 | ❌ Não existe | Calculado pelo código (V06/V05, sem dados) |
| I07 | ❌ Não existe | Calculado pelo código (V11/V02) |
| I08 | ❌ Não existe | Calculado pelo código (V12/V02) |
| I09 | ❌ Não existe | Calculado pelo código (V13/V02) |
| I10 | ❌ Não existe | Calculado pelo código (V14/V15) |

### Agregação Temporal

**Variáveis mensais (V01-V04, V11-V15):**
- Dados por mês (formato datetime "YYYY-MM-DD")
- Agregados para quadrimestre: Q1=Jan-Abr, Q2=Mai-Ago, Q3=Set-Dez (soma dos meses)
- Agregados para anual: soma dos 12 meses

**Variáveis bimestrais/trimestrais (V07-V10):**
- Dados por período (formato string "YYYY.QQ")
- Período 1 = jan-fev, 2 = mar-abr, 3 = mai-jun, 4 = jul-ago, etc.
- Agregados para quadrimestre: período 1-2 → Q1, 3-4 → Q2, 5-6 → Q3

---

## ARQUITETURA FRONTEND

### `templates/index.html` (135 linhas)

**Template Jinja2** com estrutura completa do dashboard.

#### Estrutura DOM

```
body
└── .dashboard (flex column)
    ├── .report-header (navy bg, 48px)
    │   ├── .header-left: logo CAESB
    │   ├── .header-center: "Dashboard de Riscos de Integridade"
    │   └── .header-right: ícone info
    │
    ├── .filter-bar (white bg, bottom border)
    │   ├── .filter-group: label "Indicador" + <select id="indicatorSelect">
    │   └── .filter-group: label "Ano" + 4x .year-pill (checkbox + dot + label)
    │
    ├── .report-body (flex column, max-width 1400px)
    │   ├── .kpi-row#kpiRow (grid 4 cols) — 4 KPI cards
    │   │
    │   ├── .charts-row-full
    │   │   └── .chart-card: Gráfico Principal
    │   │       ├── .chart-card-header-top: title(#mainChartTitle) + formula(#formula) + meta(#metaInfo) + badge(#semaforo) + toolbar
    │   │       ├── #legend
    │   │       ├── #mainChart (height:450px)
    │   │       └── #quarterLabels
    │   │
    │   ├── .charts-row-half
    │   │   ├── .chart-card: Variáveis → #varsChart
    │   │   └── .chart-card: Comparativo → #indicesChart
    │   │
    │   ├── .charts-row-half#secondaryRow
    │   │   ├── .chart-card: Qualidade do Dado → #qualidadeBody
    │   │   └── .chart-card: Metodologia → #metodologiaBody
    │   │
    │   └── .table-card
    │       └── table.data-table
    │           ├── thead: Ano | #periodHeader | Valor | Var. | Status
    │           └── tbody#dataTableBody
    │
    └── .tooltip#ttip (flutuante, posicionado por JS)
```

#### Toolbars

Cada `.chart-card` tem um `.visual-toolbar[data-target="..."]` com 3 botões:
- **Filtro** (desabilitado)
- **Expandir** (toggle fullscreen modal)
- **Mais** (dropdown menu com export, tabela, remover, destaque, classificar, etc.)

---

### `static/js/model.js` (222 linhas)

**Responsabilidade:** Model — dados, fórmulas, lógica de negócio. Sem manipulação DOM.

#### Variáveis Globais

| Variável | Tipo | Descrição |
|---|---|---|
| `YEARS` | `string[]` | `["2023","2024","2025","2026"]` |
| `quadStatus` | `object` | Status por quadrimestre/ano |
| `anualStatus` | `object` | Status por ano |
| `dashboardData` | `object` | Todos os 10 indicadores |
| `integrityPairs` | `object` | Pares (numerador, denominador) por indicador |
| `yearColors` | `object` | Cores CSS dos anos |
| `currentIndicator` | `string` | Indicador selecionado (ex: "I01") |
| `toolbarState` | `object` | Estado da toolbar (sort, etc.) |
| `formulas` | `object` | Funções de cálculo: `(V01/V02)*100` |
| `ICONS` | `object` | 12 SVGs inline para toolbar |

#### Funções

| Função | Params | Retorno | Descrição |
|---|---|---|---|
| `initModel()` | — | `Promise<void>` | Fetch `/api/data`, popula globais |
| `round1(n)` | number | number | Arredonda para 1 casa decimal |
| `isAnual(code)` | string | boolean | `periodicidade === "Anual"` |
| `capitalize(s)` | string | string | Primeira letra maiúscula |
| `buildSeries(code)` | string | object | Calcula séries do indicador (anual ou quadrimestral). I09 usa V02 externo de I01 |
| `validateIndicator(code)` | string | int | Conta violações de integridade (num > den) |
| `computeKpis(series, years, anual)` | object, string[], boolean | object | Calcula `{latestYear, latestValue, delta, avg, max, min}` |
| `getLatestVarSnapshot(code)` | string | array | Últimos valores de cada variável do indicador |
| `getSelectedYears()` | — | string[] | Lê anos selecionados dos checkboxes |
| `getBarWidth(count)` | int | int | Largura da barra baseada no número de anos |

#### Detalhe: `buildSeries(code)` (linhas 55-94)

**Anual:**
```
Para cada ano em YEARS:
  I09: V13 / sum(V02 de I01) × 100
  Outros: coleta vars, aplica formula[code](vars)
  Se qualquer var for null → ano = null
```

**Quadrimestral:**
```
Para cada ano em YEARS:
  Para cada período [0,1,2]:
    Coleta vars[indice_periodo]
    Se qualquer var for null → periodo = null
    Senão: formula[code](vars) → round1
```

#### Detalhe: `computeKpis(series, selectedYears, anual)` (linhas 126-173)

```
1. Coleta todos valores não-null em allValues[]
2. latestValue = primeiro não-null iterando anos reverso, períodos reverso
3. delta = latestValue - previousValue (período anterior ou ano anterior)
4. avg = mean(allValues)
5. max = max(allValues)
6. min = min(allValues)
```

---

### `static/js/view.js` (642 linhas)

**Responsabilidade:** View — toda manipulação DOM, renderização de gráficos SVG, tabelas, tooltips. Zero lógica de dados.

#### Referências DOM: objeto `els`

| Propriedade | ID do Elemento | Descrição |
|---|---|---|
| `select` | `indicatorSelect` | Select de indicadores |
| `mainChartTitle` | `mainChartTitle` | Título do gráfico principal |
| `formula` | `formula` | Exibição da fórmula |
| `metaInfo` | `metaInfo` | Meta / limite aceitável |
| `semaforo` | `semaforo` | Badge semáforo |
| `kpiRow` | `kpiRow` | Container dos 4 KPIs |
| `legend` | `legend` | Legenda de anos |
| `chart` | `mainChart` | Gráfico de barras principal |
| `quarterLabels` | `quarterLabels` | Rótulos dos períodos |
| `varsChart` | `varsChart` | Gráfico horizontal de variáveis |
| `indicesChart` | `indicesChart` | Gráfico comparativo de indicadores |
| `qualidadeBody` | `qualidadeBody` | Painel de qualidade do dado |
| `metodologiaBody` | `metodologiaBody` | Painel de metodologia |
| `tableBody` | `dataTableBody` | Tabela de dados |
| `periodHeader` | `periodHeader` | Header "Período" da tabela |
| `ttip` | `ttip` | Tooltip flutuante |

#### Funções

| Função | Descrição |
|---|---|
| `showTooltip(evt, html)` | Exibe tooltip posicionado próximo ao mouse |
| `positionTooltip(evt)` | Calcula posição, flip se overflow |
| `hideTooltip()` | Esconde tooltip com delay 120ms (anti-flicker) |
| `animateNumber(el, from, to, suffix, decimals)` | Animação ease-out cubic de 550ms |
| `syncPillState()` | Sincroniza classe `.checked` nas year pills |
| `renderKpis(series, years, anual)` | Renderiza 4 cards KPI animados |
| `renderSemaforo(code, latestValue)` | Renderiza badge verde/amarelo/vermelho/neutro |
| `renderQualidade(code)` | Renderiza 6 itens de qualidade do dado |
| `renderMetodologia(code)` | Renderiza 3 itens de metodologia + observação |
| `renderLegend(selectedYears)` | Renderiza legenda de cores dos anos |
| `buildBarTooltip(code, year, period, value, pIndex)` | Constrói HTML do tooltip da barra |
| `addReferenceLines(code, series, years, anual, multiplier)` | Adiciona linhas de referência (max, avg, min, meta) |
| `renderMainChart(code, series, years, anual)` | Renderiza gráfico de barras principal |
| `renderVarsChart(code)` | Renderiza gráfico horizontal de variáveis |
| `renderIndicesChart(currentCode)` | Renderiza comparativo de todos indicadores |
| `renderTable(code, series, years, anual)` | Renderiza tabela de dados |
| `renderDashboard(code)` | Orquestrador: chama todas as renderizações |

#### Detalhe: `renderMainChart(code, series, selectedYears, anual)` (linhas 285-440)

**Setup:**
- Limpa `#mainChart` e `#quarterLabels`
- Obtém altura do container (default 450px)
- `multiplier = (height - 42) / 100` (percentual → px)

**Anual:**
- 1 grupo `.quarter-group` com `minWidth: 100%`
- Por ano: `.bar-wrapper` → `.dynamic-bar` com altura = `value * multiplier` (mín 30px)
- Label externa `.bar-value-label` + label interna `.bar-value-inner` (se barra < 30px)
- Tooltip no hover

**Quadrimestral:**
- 3 grupos `.quarter-group` (Q1, Q2, Q3) com `minWidth: 70px`
- Max global para scaling: `halfHeight = (height - 42) / 2`
- `quadMultiplier = halfHeight / maxValue`
- Barras com `transitionDelay` escalonado

**Referências (apenas anual):**
- `addReferenceLines()` desenha linhas horizontais para max, avg, min, meta

#### Detalhe: `renderVarsChart(code)` (linhas 442-486)

- Último snapshot das variáveis via `getLatestVarSnapshot()`
- Barras horizontais com `.h-bar` (largura = `value/maxValue * 100%`, mín 8%)
- Tooltip com código, descrição e valor

#### Detalhe: `renderIndicesChart(currentCode)` (linhas 488-575)

- Todos 10 indicadores com `.h-bar` horizontal
- Barra = `Math.min(100, Math.max(0, latestValue))` (clamped 0-100%)
- Indicador atual destacado (cor accent-dark, bold)
- Click em qualquer barra → seleciona aquele indicador
- Sort ascendente/descendente via `toolbarState`

---

### `static/js/controller.js` (370 linhas)

**Responsabilidade:** Controller — eventos, toolbar, export CSV, fullscreen, menus.

#### Inicialização (DOMContentLoaded)

```
1. initModel() → fetch dados
2. Popula <select> com I01-I10
3. Bind change no select → renderDashboard()
4. Bind change nos year-checkboxes → syncPillState() + renderDashboard()
5. Global click → closeAllVisualMenus()
6. initVisualToolbars()
7. syncPillState()
8. renderDashboard("I01")
```

#### Funções

| Função | Descrição |
|---|---|
| `buildVisualMenuHTML(targetId)` | Gera HTML do dropdown menu |
| `closeAllVisualMenus()` | Fecha todos menus abertos |
| `toggleTableView(targetId)` | Alterna gráfico ↔ tabela (com save/restore innerHTML) |
| `buildMainTableHTML()` | Gera HTML da tabela do indicador atual |
| `buildVarsTableHTML()` | Gera HTML da tabela de variáveis |
| `buildIndicesTableHTML()` | Gera HTML da tabela comparativa |
| `exportVisualData(targetId)` | Gera CSV e download via Blob URL |
| `collapseExpand(card)` | Fecha fullscreen |
| `toggleExpand(targetId)` | Abre/fecha fullscreen com overlay + scale |
| `removeVisual(targetId)` | Esconde card (com restore) |
| `handleVisualSort(targetId, direction)` | Aplica sort asc/desc |
| `initVisualToolbars()` | Cria botões + menus para cada toolbar |

#### Export CSV

`exportVisualData(targetId)`:
- **indicesChart:** CSV com `Codigo,Nome,Periodicidade,Referencia,Valor` (10 linhas)
- **outros:** CSV com `Ano,Quadrimestre,Status,Valor` ou `Ano,Status,Valor`
- Download via `<a>` temporário com `download` attribute

---

## FLUXO DE DADOS COMPLETO

```
[Excel SharePoint] ←── browser-cookie3 + forms auth ──→ [Chrome Cookies]
        │                                                     │
        ▼                                                     │
  excel_provider.py                                            │
  ├── _download_excel() ── download via session autenticada ───┘
  ├── _load_excel() ── openpyxl → {V01: {year: {month: val}}}
  ├── _agg_quad() / _agg_anual()
  ├── _build_from_excel() → dict completo
  └── salva .data_cache.json
        │
        ▼
  models/__init__.py: get_dashboard_data()
  ├── Tenta Excel provider
  ├── Fallback: default_data.py
  └── Cache em memória
        │
        ▼
  routes.py: /api/data → Flask → jsonify(data)
        │
        ▼  HTTP GET
  model.js: initModel()
  ├── fetch("/api/data")
  └── Popula YEARS, dashboardData, etc.
        │
        ▼
  controller.js: renderDashboard("I01")
        │
        ▼
  view.js: renderDashboard(code)
  ├── getSelectedYears()         ← DOM
  ├── buildSeries(code)          ← model.js
  ├── computeKpis()              ← model.js
  ├── renderKpis()               → #kpiRow
  ├── renderSemaforo()           → #semaforo
  ├── renderLegend()             → #legend
  ├── renderMainChart()          → #mainChart + #quarterLabels
  ├── renderVarsChart()          → #varsChart
  ├── renderQualidade()          → #qualidadeBody
  ├── renderMetodologia()        → #metodologiaBody
  ├── renderTable()              → #dataTableBody
  └── renderIndicesChart()       → #indicesChart
```

---

## CSS — DESIGN SYSTEM

### Variáveis CSS (style.css:1-17)

```css
--navy: #002060;           /* Azul escuro primário */
--sky: #99CCFF;            /* Azul claro */
--bg-app: #f0f2f5;         /* Fundo da app */
--bg-card: #ffffff;
--border-subtle: #e1e4e8;
--text-primary: #333333;
--text-secondary: #666666;
--accent: #002060;
--positive: #1f9e6d;       /* Verde */
--negative: #d64550;       /* Vermelho */
--radius-card: 4px;
--shadow-card: 0px 1px 3px rgba(0,0,0,0.1);
--ease: cubic-bezier(.22,.61,.36,1);
```

### Principais Classes

| Seletor | Propósito |
|---|---|
| `.dashboard` | Container raiz flex column |
| `.report-header` | Header 48px, navy bg |
| `.filter-bar` | Barra de filtros com select + year pills |
| `.year-pill.checked` | Pill de ano selecionado (borda navy) |
| `.kpi-card` | Card de KPI com animação `kpiEnter` |
| `.kpi-sub.positive/.negative` | ▲ verde / ▼ vermelho |
| `.main-chart` | Container 450px, barras SVG |
| `.dynamic-bar` | Barra vertical com hover effects (scale, glow) |
| `.dynamic-bar[data-small]` | Barra pequena com label interna |
| `.quarter-group` | Grupo de barras por quadrimestre |
| `.chart-footer` | Footer com fórmula + info |
| `.ref-line-*` | Linhas de referência (max, avg, min, meta) |
| `.h-row` | Linha de gráfico horizontal |
| `.h-bar` | Barra horizontal com gradiente navy |
| `.tooltip.visible` | Tooltip flutuante animado |
| `.semaforo-badge.verde/amarelo/vermelho/neutro` | Badge semáforo |
| `.status-chip.completo/parcial/pendente` | Status chip |
| `.visual-toolbar` | Toolbar com 3 botões (aparece no hover do card) |
| `.visual-menu.open` | Dropdown menu |
| `.chart-card.expandido` | Card em fullscreen modal |
| `.chart-card.visual-hidden` | Card oculto com "clique para restaurar" |
| `.observacao-text` | Observação do indicador |
| `.data-table` | Tabela de dados |
| `.year-chip` | Chip de ano com dot colorido |

### Animações

| Nome | Efeito | Duração |
|---|---|---|
| `kpiEnter` | fadeIn + translateY(10px) | 0.4s |
| `kpiPulse` | box-shadow pulse | 2s |
| `legendEnter` | fadeIn + translateX(-4px) | 0.35s |
| `rowEnter` | fadeIn + translateX(-6px) | 0.35s |
| `tableRowEnter` | fadeIn + translateY(4px) | 0.3s |

### Responsivo

```css
@media (max-width: 900px) {
    .kpi-row { grid-template-columns: repeat(2, 1fr); }
    .charts-row, .charts-row-half { grid-template-columns: 1fr; }
}
```

---

## TESTES

### Python (28 testes)

| Arquivo | Testes | O que testa |
|---|---|---|
| `tests/test_app.py` | 2 | `create_app()` cria app, rotas registradas |
| `tests/test_models.py` | 17 | Constantes, estrutura dos indicadores, vars, periodicidade, fórmulas, integridade, consistência |
| `tests/test_routes.py` | 5 | `/` retorna HTML, `/api/data` retorna JSON com todos campos, 404 |

### JavaScript (76 testes)

| Arquivo | Testes | O que testa |
|---|---|---|
| `model.test.js` | ~25 | `round1`, `capitalize`, `isAnual`, `buildSeries` (anual, quadrimestral, null propagation, I09 special), `validateIndicator`, `computeKpis`, `getLatestVarSnapshot`, `getBarWidth` |
| `view.test.js` | ~30 | `showTooltip`/`hideTooltip`, `renderSemaforo` (verde, amarelo, vermelho, neutro, sem meta), `renderMetodologia`, `renderLegend`, `buildBarTooltip`, `renderQualidade`, `renderKpis` (4 cards, sem dados), `renderTable` |
| `controller.test.js` | ~21 | `buildVisualMenuHTML`, `closeAllVisualMenus`, `buildMainTableHTML`, `buildVarsTableHTML`, `buildIndicesTableHTML`, `exportVisualData` (indices chart, main chart anual, main chart quad), `handleVisualSort` |

### Cobertura

- Python: ~47% (app/models/ 73-100%, app/routes/ 100%, excel_provider/ 20%)
- JS: ~50% (model 95%, view 36%, controller 41%)

---

## COMO RODAR

```bash
# Servidor de desenvolvimento
python run.py                    # http://localhost:5000

# Testes Python
source venv/bin/activate
python -m pytest tests/ --cov=app -v

# Testes JavaScript
npm test                        # Jest com cobertura

# Todos os testes
npm test && python -m pytest tests/ --cov=app

# Scripts autônomos
python -m scripts.download_excel         # Baixa Excel do SharePoint
python -m scripts.parse_excel            # Analisa estrutura do Excel
python -m scripts.generate_report        # Gera relatório HTML
python -m scripts.run_all                # Pipeline completo
```

---

## SCRIPTS AUTÔNOMOS

### `scripts/download_excel.py` (145 linhas)

Download do Excel via Chrome cookies. Estratégia em 4 passos:
1. Extrai UniqueId da URL
2. Tenta `download.aspx?UniqueId=...`
3. Busca links de download na página HTML
4. Tenta URL direta do arquivo

### `scripts/parse_excel.py` (219 linhas)

Parse detalhado de todas as abas. Detecta tipo (control_chart vs other), extrai estatísticas, dados completos, contagens. Usado pelo script de relatório.

### `scripts/generate_report.py` (218 linhas)

Gera relatório HTML completo com:
- Sumário geral (tabela com todas variáveis)
- Seções detalhadas por aba (gráficos de controle)
- Dados completos em tabelas com scroll
- CSS embutido, suporte a impressão

### `scripts/run_all.py` (78 linhas)

Orquestrador: download → parse → análise estatística → relatório HTML. Exibe tempo total de execução.

---

## MANUTENÇÃO

### Adicionar novo indicador

1. Adicionar dados hardcoded em `default_data.py` (dashboardData, formulas, integrityPairs)
2. Se vier do Excel: verificar se a aba V-sheet existe no SharePoint
3. Adicionar entrada em `FORMULAS` em `excel_provider.py`
4. Adicionar testes em `test_models.py`

### Atualizar estrutura do Excel

Se o Excel for modificado (novas colunas, novos períodos):
- `_parse_sheet()` em `excel_provider.py` pode precisar de ajustes
- O parse depende de encontrar "Período" na coluna A (linhas 1-20)
- A coluna B é lida como "Soma"

### Cache

- TTL: 300 segundos (5 minutos)
- Dois níveis: Excel bruto (`.excel_cache.xlsx`) e JSON processado (`.data_cache.json`)
- Para forçar reload: deletar os arquivos `.excel_cache.xlsx` e `.data_cache.json`
- Ou chamar `get_dashboard_data(force_reload=True)` (apenas via código)

### Cookies SharePoint

A autenticação depende do Chrome estar logado no SharePoint (`caesbdfgovbr.sharepoint.com`). Cookies necessários:
- `FedAuth` (domínio: `caesbdfgovbr.sharepoint.com`)
- `rtFa` (domínio: `.sharepoint.com`)

Se os cookies expirarem, o download falha e o sistema usa fallback. O usuário precisa reabrir o SharePoint no Chrome para renovar os cookies.
