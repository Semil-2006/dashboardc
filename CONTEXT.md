# Contexto do Projeto — Dashboard de Riscos de Integridade (CAESB)

## Visão Geral

Dashboard corporativo estilo Power BI para monitoramento de **10 indicadores de integridade e compliance** da CAESB (Companhia de Saneamento Ambiental do Distrito Federal). Acompanha métricas como denúncias de assédio, nepotismo, conflito de interesses, efetividade de apuração, treinamento em compliance, entre outros.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.12 + Flask 3.1 |
| Frontend | HTML5 + CSS3 (vanilla) + JavaScript ES6 (vanilla) |
| Templates | Jinja2 |
| Testes JS | Jest 30 + jsdom |
| Testes Python | pytest + pytest-cov |

## Arquitetura (MVC)

```
run.py                          ← Entry point (dev server)
app/
  ├── __init__.py               ← Flask app factory
  ├── routes.py                 ← Controller (rotas / e /api/data)
  └── models/
      └── models.py             ← Model (dados hardcoded, fórmulas)
static/
  ├── css/style.css             ← Estilos (925 linhas, design Power BI)
  └── js/
      ├── model.js              ← Model (lógica de negócio, séries, KPIs)
      ├── view.js               ← View (renderização DOM, gráficos, tabelas)
      └── controller.js         ← Controller (eventos, toolbar, export)
templates/
  └── index.html                ← Template Jinja2
```

### Fluxo de Dados

1. `controller.js` → chama `initModel()` em `model.js`
2. `model.js` → faz fetch de `/api/data` (rota Flask que retorna JSON com todos os dados)
3. `controller.js` → chama `renderDashboard(code)` em `view.js`
4. `view.js` → consome funções de `model.js` (`buildSeries`, `computeKpis`, etc.) para renderizar gráficos, KPIs, tabelas e tooltips

## Dados

Todos os dados são **hardcoded** em `app/models/models.py`. Não há banco de dados. O backend serve os dados via API REST (`/api/data`).

10 indicadores (`I01`–`I10`), cada um com:
- Nome, fórmula, periodicidade (Quadrimestral ou Anual), granularidade
- Meta e limite aceitável (definidos após 15 coletas válidas)
- Variáveis brutas (V01, V02, etc.) com dados por ano/quadrimestre
- Sentido bom ("alto" = quanto maior melhor; "baixo" = quanto menor melhor)

### Periodicidade

| Tipo | Indicadores | Dados |
|---|---|---|
| Quadrimestral | I01, I02, I03, I07, I08 | 3 valores por ano (Q1, Q2, Q3) |
| Anual | I04, I05, I06, I09, I10 | 1 valor por ano |

### Simulação Temporal

Data simulada: **06/07/2026**.
- 2023–2025: completos
- 2026 Q1: completo, Q2: parcial, Q3: pendente
- 2026 anual: pendente

## Como Rodar

```bash
# Backend
python run.py                    # Servidor em http://localhost:5000

# Testes Python
source venv/bin/activate
python -m pytest tests/ --cov=app

# Testes JS
npm test                         # Jest com cobertura

# Todos os testes
npm test && python -m pytest tests/ --cov=app
```

## Testes

### Python (29 testes, 100% de cobertura)

| Arquivo | O que testa |
|---|---|
| `tests/test_models.py` | Estrutura dos dados, fórmulas, pares de integridade, consistência |
| `tests/test_routes.py` | Respostas das rotas `/` e `/api/data` |
| `tests/test_app.py` | Criação da app Flask e registro de rotas |

### JavaScript (76 testes, ~51% de cobertura)

| Arquivo | O que testa |
|---|---|
| `static/js/__tests__/model.test.js` | `round1`, `capitalize`, `isAnual`, `buildSeries`, `validateIndicator`, `computeKpis`, `getLatestVarSnapshot`, `getBarWidth` |
| `static/js/__tests__/view.test.js` | `showTooltip`/`hideTooltip`, `renderSemaforo`, `renderMetodologia`, `renderLegend`, `buildBarTooltip`, `renderQualidade`, `renderKpis`, `renderTable` |
| `static/js/__tests__/controller.test.js` | `buildVisualMenuHTML`, `closeAllVisualMenus`, `buildMainTableHTML`, `buildVarsTableHTML`, `buildIndicesTableHTML`, `exportVisualData`, `handleVisualSort` |

## Convenções de Código

- **Idioma:** Código fonte em português (variáveis, comentários, nomes de indicadores)
- **JS:** Sem frameworks ou bibliotecas externas; manipulação DOM pura; gráficos SVG customizados
- **CSS:** Design system com variáveis CSS; paleta institucional CAESB
- **Python:** Flask com Blueprint; dados estáticos em dicionários
- **Testes:** Jest para JS com transform customizado p/ instrumentar vanilla JS; pytest para Python
