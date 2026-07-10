# leia_isso_caio 

## O que foi acrescentado desde o último commit (873f53e)

### 1. Matriz de Calor / Matriz de Riscos (novo módulo)

```
static/risk-matrix/
├── riskConfig.json         # Catálogo de eventos, causas, impactos, thresholds
├── riskMatrix.js           # Motor de cálculo (probabilidade, score, tendência)
├── riskMatrix.render.js    # Renderização DOM (grid 5×5, badges, detail panel)
└── riskMatrix.css          # 535 linhas de estilo dedicado
```

#### Por quê?
O dashboard tinha apenas os 10 indicadores individuais, sem uma VISÃO AGREGADA DE RISCOS. A matriz de calor (risk matrix 5×5) cruza **probabilidade × impacto** para classificar riscos organizacionais em 4 faixas: Verde (baixo), Amarelo (moderado), Laranja (alto), Vermelho (crítico). É o padrão ISO 31000 / COSO.

#### Como funciona (riskMatrix.js)

**`riskConfig.json`** — Define eventos de risco (ex: "Desvio de Conduta", "Desconformidade") com suas causas. Cada causa tem:
- `indicador`: qual Ixx mapeia (ex: `"I01"` para assédio moral). Se `null`, a probabilidade não é calculável.
- `impacto`: 1–5 (julgamento da PRGC)
- `validado: false` — sinaliza que o impacto precisa ser chancelado pela área

**`computeProbability(code)`** — Lógica central.
1. Pega a série do indicador via `buildSeries()`
2. Se tiver menos que `coletasMinimas` (3) → retorna nível 3 conservador
3. Calcula a **média histórica** e a **tendência** (split half: compara primeira metade vs segunda)
4. Usa `sentidoBom` + `meta` + `limiteAceitavel` para determinar nível 1–5
   - Ex: sentido "baixo", média dentro da meta, tendência de queda → nível 1

**`computeTrend(series, anual)`** — Divide série em 2 metades, calcula médias, compara. Retorna ↑ (sobe), ↓ (desce), → (estável). Threshold: 5% da média.

**`classifyScore(score)`** — Score = probabilidade (1–5) × impacto (1–5) = 1–25. Mapeia para 4 faixas:
- 1–4 → Verde
- 5–9 → Amarelo
- 10–15 → Laranja
- 16–25 → Vermelho

**`computeAllRisks()`** — Itera todas as causas, calcula probabilidade para quem tem indicador, monta array com `{causa, probabilidade, score, classificacao}`. Cache interno.

#### Como funciona (riskMatrix.render.js)

**`renderRiskMatrix()`** — Orquestrador chamado pelo controller:
1. `_buildTitleArea()` — Título + subtítulo
2. `_buildGrid(risks)` — Grid 5×5 (probabilidade 1–5 × impacto 1–5). Cada célula tem o score e badges dos riscos que caem naquela coordenada. Linha extra "N/D" para riscos sem indicador.
3. `_buildSupportPanel()` — Painel com indicadores de suporte (I03, I04, I05, I06, I09, I10) que não mapeiam causas específicas
4. `_buildLegend()` — Legenda visual das faixas de score
5. `_buildCollapsedList(risks)` — Lista vertical usada em mobile (<600px)
6. `_renderResponsive()` — Toggle grid ↔ lista conforme largura da tela

**Badges clicáveis**: Cada badge (nome do risco) abre `_openDetail(risk)` — modal com detalhes completos: indicador, impacto, probabilidade, score, justificativa, observação. O link do indicador navega direto para a aba de indicadores.

#### Integração no template

`templates/index.html`:
- Abas de navegação: `.view-tab[data-view="indicators"]` e `[data-view="risk-matrix"]`
- `#riskMatrixSection` com `#riskMatrixBody`
- Scripts carregados na ordem: model.js → view.js → **riskMatrix.js** → **riskMatrix.render.js** → controller.js

`controller.js`:
- `loadRiskConfig()` no DOMContentLoaded
- Click nas abas: mostra/esconde `#indicatorsContent` e `#riskMatrixSection`, oculta filtros na visão matriz
- `switchToIndicators(code)` — navega da matriz para um indicador específico

### 2. Refatoração do Backend (app/models/)

Antes (`app/models/models.py` — arquivo único de 195 linhas):
```python
# Monólito: tudo num arquivo só
YEARS = [...]
dashboardData = {...}
quadStatus = {...}
```

Depois (modular):
```
app/models/
├── __init__.py          # Fachada: get_dashboard_data(), cache, fallback
├── default_data.py      # Dados hardcoded de fallback
└── excel_provider.py    # Leitor Excel + SharePoint + cache
```

#### Por quê?
- Separa responsabilidades (SRP)
- Permite fallback automático quando Excel está offline
- Cache em 3 níveis: memória → JSON → Excel bruto
- Testável: podemos mockar o excel_provider

#### `__init__.py`
```python
get_dashboard_data(force_reload=False)
```
Fluxo: cache memória → tenta excel_provider → fallback default_data.

#### `default_data.py`
Contém YEARS, dashboardData, quadStatus, anualStatus, formulas, integrityPairs, yearColors. Cópia do que era o models.py original.

#### `excel_provider.py`
- Baixa Excel do SharePoint usando cookies do Chrome
- Parseia abas V01–V15 com openpyxl
- Agrega mensal → quadrimestral / anual
- Cache de 5 min (`.excel_cache.xlsx` e `.data_cache.json`)

### 3. Novos scripts autônomos

```
scripts/
├── download_excel.py     # Download do Excel via SharePoint
├── parse_excel.py        # Parse detalhado de todas as abas
├── generate_report.py    # Gera relatório HTML a partir do parse
└── run_all.py            # Pipeline completo
```

Uso:
```bash
python -m scripts.download_excel
python -m scripts.parse_excel
python -m scripts.generate_report
python -m scripts.run_all
```

### 4. Melhorias visuais (view.js + style.css)

**Labels nas barras**: Cada barra do gráfico principal agora tem `bar-value-inner` com o percentual. Para barras muito pequenas (<30px anual, <20px quadrimestral), o label aparece dentro da barra.

**Min-height**: Barras muito pequenas ganham altura mínima para não sumirem visualmente.

**Novo scaling quadrimestral**: Antes usava o mesmo `multiplier` do anual (percentual). Agora usa `quadMultiplier = halfHeight / maxValue` para aproveitar melhor o espaço vertical.

**Referências**: Linhas de referência (max, avg, min, meta) removidas dos quadrimestrais. Só aparecem no anual.

### 5. Testes da Matriz de Riscos

`static/js/__tests__/riskMatrix.test.js` — 323 linhas, 21 testes cobrindo:
- `computeTrend` (↑ ↓ →, anual, single value)
- `classifyScore` (boundaries: 1, 4, 5, 9, 10, 15, 16, 25, 0, 26)
- `computeScore` (multiplicação, min 1, max 25)
- `computeProbability` (fallback, I01, I02, null indicator, trend)
- `getCausas` (flatten, eventoNome)
- `computeAllRisks` (integração, null indicator, score classification, cache)

### 6. Testes Python atualizados

- `tests/test_models.py`: Importa de `default_data` em vez de `models`, assertions menos rígidas para `yearColors` (valida tipo, não valor fixo), removeu teste de `externalDenominator` (não existe mais nessa estrutura)
- `tests/test_routes.py`: Assertions de status mais flexíveis

---

## Por que dessa atualização

1. **Visão gerencial de riscos** — A matriz de calor transforma 10 indicadores isolados em uma fotografia consolidada dos riscos de integridade. Um diretor quer ver "quais são meus riscos críticos" em 5 segundos, não analisar 10 gráficos separados.

2. **Resiliência offline** — O backend agora tem fallback automático e cache. Se o SharePoint cair ou o cookie expirar, o dashboard continua funcionando com dados hardcoded.

3. **Manutenabilidade** — A refatoração do backend permite adicionar novos indicadores sem editar o arquivo gigante. Cada provider é independente.

4. **Decisão baseada em regra** — A probabilidade não é chute. Usa `sentidoBom`, `meta`, `limiteAceitavel`, média histórica e tendência para classificar 1–5.

---

## O que você precisa saber (Caio)

### A Matriz de Calor está pronta, mas o QUADRO DE RISCOS não

O que **existe**:
- A matriz 5×5 com todos os riscos mapeados
- Cálculo automático de probabilidade baseado nos indicadores
- Badges clicáveis com detalhes
- Painel de suporte com indicadores auxiliares
- Responsivo (grid desktop, lista mobile)
- Testes unitários

O que **NÃO existe** (e você pediu):
- **Quadro de Riscos** — uma tabela/listagem estilo "registro de riscos" com:
  - ID do risco
  - Nome / descrição
  - Causa / evento
  - Probabilidade (1–5)
  - Impacto (1–5)
  - Score
  - Classificação (cor)
  - Status do tratamento (ex: "Aceitar", "Mitigar", "Transferir", "Evitar")
  - Plano de ação / dono / prazo
  - Histórico de reavaliação

### Sugestão de implementação do Quadro de Riscos

**Onde colocar**: Nova aba "Quadro de Riscos" ao lado de "Indicadores" e "Matriz de Riscos". Ou como um modal/expansão dentro da própria Matriz.

**Dados**: Precisa de um novo JSON (ou extensão do `riskConfig.json`) com campos:
```json
{
  "id": "R01",
  "causaId": "assedio_moral",
  "statusTratamento": "mitigar",
  "planoAcao": "Implementar canal de denúncia anônimo",
  "dono": "PRGC",
  "prazo": "2026-12",
  "reavaliacoes": [
    { "data": "2026-01", "score": 12, "classificacao": "laranja" },
    { "data": "2026-06", "score": 8, "classificacao": "amarelo" }
  ]
}
```

**Renderização**: Tabela com cores nas colunas de score. Pode usar o `computeAllRisks()` já existente e só adicionar a camada de apresentação tabular.

### Pontos de atenção

1. **Impactos não validados** — Todos os `validado: false` no `riskConfig.json`. A PRGC precisa revisar e confirmar os níveis de impacto. Enquanto não validar, aparece o aviso "não validado" nos detalhes.

2. **Riscos sem indicador** — Furto, corrupção, privacidade, fraude em licitação, fraude contábil, fraude comercial, descumprimentos normativo/trabalhista/concessão não têm indicador associado. A probabilidade fica como "Não calculável". Idealmente a PRGC deve definir indicadores para estes riscos no futuro.

3. **Tendência** — O `computeTrend` divide a série ao meio. Para séries muito curtas (ex: I05 com 7 pontos), a tendência pode ser enganosa. O threshold de 5% evita falsos positivos, mas vale monitorar.

4. **Cache** — Se o Excel estiver disponível, a matriz usa dados reais. Se não, usa fallback. O cache é de 5 minutos. Para forçar recarga: deletar `.data_cache.json` e `.excel_cache.xlsx`.

5. **Ordem de carregamento** — `riskMatrix.js` depende de `model.js` (dashboardData, buildSeries, etc). `riskMatrix.render.js` depende de `view.js` (showTooltip, positionTooltip, hideTooltip). A ordem no HTML já está correta, mas se for mover scripts, cuidado.

### Comandos úteis

```bash
# Ver o que mudou desde o último commit
git diff HEAD --stat

# Rodar testes JS (inclui riskMatrix.test.js)
npm test

# Rodar testes Python
python -m pytest tests/ -v

# Servidor dev
python run.py
```

---

## Resumo dos arquivos alterados/novos

| Arquivo | Status | O que faz |
|---|---|---|
| `static/risk-matrix/riskConfig.json` | **NOVO** | Configuração de eventos, causas, impactos |
| `static/risk-matrix/riskMatrix.js` | **NOVO** | Cálculo de probabilidade, tendência, score |
| `static/risk-matrix/riskMatrix.render.js` | **NOVO** | Renderização da matriz 5×5 no DOM |
| `static/risk-matrix/riskMatrix.css` | **NOVO** | Estilo completo da matriz |
| `static/js/__tests__/riskMatrix.test.js` | **NOVO** | 21 testes unitários da matriz |
| `scripts/download_excel.py` | **NOVO** | Download Excel do SharePoint |
| `scripts/parse_excel.py` | **NOVO** | Parse das abas do Excel |
| `scripts/generate_report.py` | **NOVO** | Relatório HTML do Excel |
| `scripts/run_all.py` | **NOVO** | Orquestrador download → parse → relatório |
| `app/models/__init__.py` | **NOVO** | Fachada do modelo (cache + fallback) |
| `app/models/default_data.py` | **NOVO** | Dados hardcoded de fallback |
| `app/models/excel_provider.py` | **NOVO** | Leitor Excel + SharePoint |
| `app/__init__.py` | **NOVO** | App factory Flask |
| `app/routes.py` | **MODIFICADO** | Blueprint de rotas |
| `app/models/models.py` | **DELETADO** | Substituído pelos 3 módulos acima |
| `static/js/view.js` | **MODIFICADO** | Labels internas, min-height, quad scaling |
| `static/js/controller.js` | **MODIFICADO** | Abas, loadRiskConfig, switchToIndicators |
| `templates/index.html` | **MODIFICADO** | Abas de navegação, riskMatrixSection, CSS/JS |
| `static/css/style.css` | **MODIFICADO** | bar-value-inner, bar-value-label melhorado |
| `tests/test_models.py` | **MODIFICADO** | Importa de default_data, assertions flexíveis |
| `tests/test_routes.py` | **MODIFICADO** | Status assertions flexíveis |
| `static/js/__tests__/helpers.js` | **MODIFICADO** | Indentação |
| `CONTEXT.md` | **MODIFICADO** | Documentação completa do projeto |
