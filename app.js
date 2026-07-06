/* =========================================================================
   DASHBOARD DE RISCOS DE INTEGRIDADE — CAESB
   Reescrita alinhada ao Documento de Requisitos (PRGR/PRGC/PRTA):
   - I01, I02, I03, I07, I08 → coleta MENSAL, consolidação QUADRIMESTRAL
     (3 quadrimestres por ano: Q1=Jan-Abr, Q2=Mai-Ago, Q3=Set-Dez)
   - I04, I05, I06, I09, I10 → granularidade ANUAL (1 valor fechado por ano)
   - Os valores dos indicadores são CALCULADOS em tempo de execução a partir
     das variáveis brutas (V01, V02...), nunca digitados "prontos" — isso
     permite validar as regras de integridade do documento (numerador não
     pode ser maior que denominador, sem negativos) e manter rastreabilidade.
   - I09 usa como denominador o total de denúncias do ANO INTEIRO, obtido
     somando os 3 quadrimestres de I01/V02 — demonstra a integração real
     entre a camada quadrimestral e a camada anual pedida no documento.
   - "Hoje" simulado = 06/07/2026 → 2026 Q1 fechado, Q2 em andamento
     (parcial), Q3 ainda não iniciado. O ano de 2026 (anual) ainda não
     fechou, logo os indicadores anuais aparecem como "pendente".
   ========================================================================= */

const YEARS = ["2023", "2024", "2025", "2026"];

/* Status de coleta compartilhado (mesma linha do tempo p/ todos os
   indicadores quadrimestrais e todos os anuais, respectivamente) */
const quadStatus = {
    2023: ["completo", "completo", "completo"],
    2024: ["completo", "completo", "completo"],
    2025: ["completo", "completo", "completo"],
    2026: ["completo", "parcial", "pendente"]
};
const anualStatus = {
    2023: "completo",
    2024: "completo",
    2025: "completo",
    2026: "pendente"
};

/* ---------- DADOS BRUTOS (variáveis) POR INDICADOR ---------- */

const dashboardData = {
    I01: {
        name: "Percentual de denúncias de assédio moral",
        formula: "(V01 / V02) × 100",
        periodicidade: "Quadrimestral",
        granularidade: "Mensal, com consolidação quadrimestral",
        sentidoBom: "baixo",
        coletasValidas: 39,
        meta: 20,
        limiteAceitavel: 30,
        observacao: null,
        vars: {
            V01: { label: "Denúncias de assédio moral", data: { 2023: [6, 7, 7], 2024: [7, 6, 7], 2025: [5, 5, 4], 2026: [3, 3, null] } },
            V02: { label: "Total de denúncias", data: { 2023: [15, 18, 20], 2024: [22, 19, 24], 2025: [20, 23, 21], 2026: [18, 16, null] } }
        }
    },
    I02: {
        name: "Percentual de denúncias de assédio sexual",
        formula: "(V03 / V02) × 100",
        periodicidade: "Quadrimestral",
        granularidade: "Mensal, com consolidação quadrimestral",
        sentidoBom: "baixo",
        coletasValidas: 39,
        meta: 10,
        limiteAceitavel: 15,
        observacao: "No Documento de Requisitos, a variável V03 do I02 está descrita como \"Denúncias de assédio moral\" — provável erro de digitação da ficha original, já que I02 trata de assédio sexual. Corrigido aqui; recomenda-se validar com a PRGC antes de publicar.",
        vars: {
            V03: { label: "Denúncias de assédio sexual", data: { 2023: [3, 3, 3], 2024: [4, 3, 3], 2025: [2, 2, 2], 2026: [1, 1, null] } },
            V02: { label: "Total de denúncias", data: { 2023: [15, 18, 20], 2024: [22, 19, 24], 2025: [20, 23, 21], 2026: [18, 16, null] } }
        }
    },
    I03: {
        name: "Efetividade de apuração de denúncias recebidas",
        formula: "(V04 / V02) × 100",
        periodicidade: "Quadrimestral",
        granularidade: "Mensal, com consolidação quadrimestral",
        sentidoBom: "alto",
        coletasValidas: 39,
        meta: 85,
        limiteAceitavel: 70,
        observacao: "Aplicar os critérios de admissibilidade da Instrução Normativa nº 04/2012-CGDF na apuração das denúncias, conforme ressalva do documento de requisitos.",
        vars: {
            V04: { label: "Denúncias apuradas e tratadas", data: { 2023: [11, 13, 15], 2024: [17, 15, 20], 2025: [17, 20, 19], 2026: [17, 15, null] } },
            V02: { label: "Total de denúncias", data: { 2023: [15, 18, 20], 2024: [22, 19, 24], 2025: [20, 23, 21], 2026: [18, 16, null] } }
        }
    },
    I04: {
        name: "Atendimento da Lei 6.112/2018 (Integridade das Contratadas)",
        formula: "(V06 / V05) × 100",
        periodicidade: "Anual",
        granularidade: "Anual",
        sentidoBom: "alto",
        coletasValidas: 3,
        meta: null,
        limiteAceitavel: null,
        observacao: null,
        vars: {
            V05: { label: "Contratos enviados à CGDF", data: { 2023: 40, 2024: 55, 2025: 60, 2026: null } },
            V06: { label: "Contratos enquadrados", data: { 2023: 26, 2024: 45, 2025: 58, 2026: null } }
        }
    },
    I05: {
        name: "Percentual de empregados e membros dos órgãos estatutários treinados",
        formula: "(V07 / V08) × 100",
        periodicidade: "Anual",
        granularidade: "Anual",
        sentidoBom: "alto",
        coletasValidas: 3,
        meta: null,
        limiteAceitavel: null,
        observacao: null,
        vars: {
            V07: { label: "Empregados/membros treinados", data: { 2023: 165, 2024: 250, 2025: 320, 2026: null } },
            V08: { label: "Total de empregados-membros", data: { 2023: 300, 2024: 320, 2025: 340, 2026: null } }
        }
    },
    I06: {
        name: "Percentual de evasão no treinamento de compliance",
        formula: "(V09 / V10) × 100",
        periodicidade: "Anual",
        granularidade: "Anual",
        sentidoBom: "baixo",
        coletasValidas: 3,
        meta: null,
        limiteAceitavel: null,
        observacao: "Variável ajustada: V09 antes duplicava indevidamente V08 na ficha original. Corrigido para refletir evasões sobre vagas ofertadas (V10).",
        vars: {
            V09: { label: "Evasões", data: { 2023: 33, 2024: 25, 2025: 14, 2026: null } },
            V10: { label: "Vagas ofertadas", data: { 2023: 150, 2024: 180, 2025: 200, 2026: null } }
        }
    },
    I07: {
        name: "Percentual de denúncias de nepotismo",
        formula: "(V11 / V02) × 100",
        periodicidade: "Quadrimestral",
        granularidade: "Mensal, com consolidação quadrimestral",
        sentidoBom: "baixo",
        coletasValidas: 39,
        meta: 8,
        limiteAceitavel: 12,
        observacao: "Variável ajustada: V11 antes era identificada como V10 na ficha original.",
        vars: {
            V11: { label: "Denúncias de nepotismo", data: { 2023: [2, 2, 2], 2024: [2, 2, 2], 2025: [2, 2, 1], 2026: [1, 1, null] } },
            V02: { label: "Total de denúncias", data: { 2023: [15, 18, 20], 2024: [22, 19, 24], 2025: [20, 23, 21], 2026: [18, 16, null] } }
        }
    },
    I08: {
        name: "Percentual de denúncias sobre conflito de interesse",
        formula: "(V12 / V02) × 100",
        periodicidade: "Quadrimestral",
        granularidade: "Mensal, com consolidação quadrimestral",
        sentidoBom: "baixo",
        coletasValidas: 39,
        meta: 12,
        limiteAceitavel: 18,
        observacao: "Variável ajustada: V12 antes era identificada como V11 na ficha original.",
        vars: {
            V12: { label: "Denúncias de conflito de interesses", data: { 2023: [3, 4, 4], 2024: [4, 3, 4], 2025: [3, 3, 2], 2026: [2, 1, null] } },
            V02: { label: "Total de denúncias", data: { 2023: [15, 18, 20], 2024: [22, 19, 24], 2025: [20, 23, 21], 2026: [18, 16, null] } }
        }
    },
    I09: {
        name: "Percentual de procedência de denúncias",
        formula: "(V13 / V02 anual) × 100",
        periodicidade: "Anual",
        granularidade: "Anual",
        sentidoBom: "alto",
        coletasValidas: 3,
        meta: null,
        limiteAceitavel: null,
        observacao: "Variável ajustada: V13 antes era identificada como V12 na ficha original. O denominador (V02) é o total de denúncias do ANO INTEIRO, obtido somando os 3 quadrimestres já apurados em I01. Sentido de leitura (percentual alto = positivo, pois indica apuração eficaz) ainda precisa ser confirmado com a PRGC — pode também ser lido como alerta se a maioria das denúncias for procedente.",
        externalDenominator: "I01.V02",
        vars: {
            V13: { label: "Denúncias procedentes", data: { 2023: 24, 2024: 44, 2025: 53, 2026: null } }
        }
    },
    I10: {
        name: "Percentual de PAD, TCE, sindicância e apuração ética com penalidade",
        formula: "(V14 / V15) × 100",
        periodicidade: "Anual",
        granularidade: "Anual",
        sentidoBom: "alto",
        coletasValidas: 3,
        meta: null,
        limiteAceitavel: null,
        observacao: "Variáveis ajustadas: V14 antes era identificada como V13 e V15 antes era identificada como V14 na ficha original.",
        vars: {
            V14: { label: "Denúncias com penalidade", data: { 2023: 11, 2024: 28, 2025: 47, 2026: null } },
            V15: { label: "Denúncias enviadas", data: { 2023: 30, 2024: 45, 2025: 55, 2026: null } }
        }
    }
};

/* ---------- FÓRMULAS DE CÁLCULO (aplicadas sobre as variáveis brutas) ---------- */

const formulas = {
    I01: v => (v.V01 / v.V02) * 100,
    I02: v => (v.V03 / v.V02) * 100,
    I03: v => (v.V04 / v.V02) * 100,
    I04: v => (v.V06 / v.V05) * 100,
    I05: v => (v.V07 / v.V08) * 100,
    I06: v => (v.V09 / v.V10) * 100,
    I07: v => (v.V11 / v.V02) * 100,
    I08: v => (v.V12 / v.V02) * 100,
    I09: v => (v.V13 / v.V02) * 100,
    I10: v => (v.V14 / v.V15) * 100
};

/* Pares [numerador, denominador] usados na validação de integridade */
const integrityPairs = {
    I01: ["V01", "V02"], I02: ["V03", "V02"], I03: ["V04", "V02"],
    I04: ["V06", "V05"], I05: ["V07", "V08"], I06: ["V09", "V10"],
    I07: ["V11", "V02"], I08: ["V12", "V02"], I09: ["V13", "V02"], I10: ["V14", "V15"]
};

function round1(n) { return Math.round(n * 10) / 10; }
function isAnual(code) { return dashboardData[code].periodicidade === "Anual"; }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/* ---------- CÁLCULO DAS SÉRIES A PARTIR DAS VARIÁVEIS ---------- */

function buildSeries(code) {
    const ind = dashboardData[code];
    const series = {};

    if (isAnual(code)) {
        YEARS.forEach(year => {
            if (code === "I09") {
                const v02arr = dashboardData.I01.vars.V02.data[year];
                const v13 = ind.vars.V13.data[year];
                const denomOk = v02arr && v02arr.every(x => x !== null);
                series[year] = (denomOk && v13 !== null && v13 !== undefined)
                    ? round1((v13 / v02arr.reduce((a, b) => a + b, 0)) * 100)
                    : null;
                return;
            }
            const varsForYear = {};
            let complete = true;
            Object.keys(ind.vars).forEach(vc => {
                const val = ind.vars[vc].data[year];
                if (val === null || val === undefined) complete = false;
                varsForYear[vc] = val;
            });
            series[year] = complete ? round1(formulas[code](varsForYear)) : null;
        });
    } else {
        YEARS.forEach(year => {
            series[year] = [0, 1, 2].map(i => {
                const varsForPeriod = {};
                let complete = true;
                Object.keys(ind.vars).forEach(vc => {
                    const val = ind.vars[vc].data[year][i];
                    if (val === null || val === undefined) complete = false;
                    varsForPeriod[vc] = val;
                });
                return complete ? round1(formulas[code](varsForPeriod)) : null;
            });
        });
    }
    return series;
}

/* ---------- VALIDAÇÃO DAS REGRAS DE INTEGRIDADE DO DOCUMENTO ---------- */
/* Valores negativos não permitidos; numerador não pode ser > denominador */

function validateIndicator(code) {
    const ind = dashboardData[code];
    const [numCode, denCode] = integrityPairs[code];
    let violations = 0;

    YEARS.forEach(year => {
        if (isAnual(code)) {
            if (code === "I09") {
                const numVal = ind.vars.V13.data[year];
                if (numVal !== null && numVal < 0) violations++;
                return;
            }
            const numVal = ind.vars[numCode].data[year];
            const denVal = ind.vars[denCode].data[year];
            if (numVal === null || denVal === null) return;
            if (numVal < 0 || denVal < 0) violations++;
            if (numVal > denVal) violations++;
        } else {
            for (let i = 0; i < 3; i++) {
                const numVal = ind.vars[numCode].data[year][i];
                const denVal = ind.vars[denCode].data[year][i];
                if (numVal === null || denVal === null) continue;
                if (numVal < 0 || denVal < 0) violations++;
                if (numVal > denVal) violations++;
            }
        }
    });
    return violations;
}

/* ---------- PALETA E ELEMENTOS ---------- */

const yearColors = {
    2023: "#8FC7EC",
    2024: "#3E9BE0",
    2025: "#0072BC",
    2026: "#00335B"
};
const varColor = "#0072BC";

let currentIndicator = "I01";

const els = {
    select: document.getElementById("indicatorSelect"),
    mainChartTitle: document.getElementById("mainChartTitle"),
    formula: document.getElementById("formula"),
    metaInfo: document.getElementById("metaInfo"),
    semaforo: document.getElementById("semaforo"),
    kpiRow: document.getElementById("kpiRow"),
    legend: document.getElementById("legend"),
    chart: document.getElementById("mainChart"),
    quarterLabels: document.getElementById("quarterLabels"),
    varsChart: document.getElementById("varsChart"),
    qualidadeBody: document.getElementById("qualidadeBody"),
    metodologiaBody: document.getElementById("metodologiaBody"),
    tableBody: document.getElementById("dataTableBody"),
    periodHeader: document.getElementById("periodHeader"),
    ttip: document.getElementById("ttip")
};

/* ---------- TOOLTIP HELPERS (estilo Power BI) ---------- */

function showTooltip(evt, html) {
    els.ttip.innerHTML = html;
    els.ttip.style.display = "block";
    requestAnimationFrame(() => els.ttip.classList.add("visible"));
    positionTooltip(evt);
}

function positionTooltip(evt) {
    const offset = 14;
    const rect = els.ttip.getBoundingClientRect();

    let x = evt.clientX + offset;
    let y = evt.clientY - rect.height - offset;

    if (x + rect.width > window.innerWidth - 8) {
        x = evt.clientX - rect.width - offset;
    }
    if (y < 8) {
        y = evt.clientY + offset;
    }

    els.ttip.style.left = `${x}px`;
    els.ttip.style.top = `${y}px`;
}

function hideTooltip() {
    els.ttip.classList.remove("visible");
    setTimeout(() => {
        if (!els.ttip.classList.contains("visible")) {
            els.ttip.style.display = "none";
        }
    }, 120);
}

/* ---------- SETUP INDICATOR SELECT ---------- */

Object.keys(dashboardData).forEach(code => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = `${code} · ${dashboardData[code].name}`;
    els.select.appendChild(opt);
});

els.select.value = currentIndicator;

els.select.addEventListener("change", () => {
    currentIndicator = els.select.value;
    renderDashboard(currentIndicator);
});

/* ---------- YEAR PILLS ---------- */

function syncPillState() {
    document.querySelectorAll(".year-pill").forEach(pill => {
        const checked = pill.querySelector(".year-checkbox").checked;
        pill.classList.toggle("checked", checked);
    });
}

document.querySelectorAll(".year-checkbox").forEach(box => {
    box.addEventListener("change", () => {
        syncPillState();
        renderDashboard(currentIndicator);
    });
});

function getSelectedYears() {
    return [...document.querySelectorAll(".year-checkbox:checked")].map(cb => cb.value);
}

/* ---------- KPI CALC (considera valores nulos = coleta pendente) ---------- */

function computeKpis(series, selectedYears, anual) {
    const allValues = [];
    selectedYears.forEach(y => {
        if (anual) {
            if (series[y] !== null) allValues.push(series[y]);
        } else {
            series[y].forEach(v => { if (v !== null) allValues.push(v); });
        }
    });

    let latestYear = null, latestValue = null, prevValue = null;
    for (let i = selectedYears.length - 1; i >= 0 && latestValue === null; i--) {
        const y = selectedYears[i];
        if (anual) {
            if (series[y] !== null) { latestYear = y; latestValue = series[y]; }
        } else {
            for (let p = 2; p >= 0; p--) {
                if (series[y][p] !== null) { latestYear = y; latestValue = series[y][p]; break; }
            }
        }
    }

    if (latestValue !== null && !anual) {
        const yIdx = selectedYears.indexOf(latestYear);
        const periodIdx = series[latestYear].lastIndexOf(latestValue);
        if (periodIdx > 0 && series[latestYear][periodIdx - 1] !== null) {
            prevValue = series[latestYear][periodIdx - 1];
        } else if (yIdx > 0) {
            const prevYear = selectedYears[yIdx - 1];
            const prevArr = series[prevYear].filter(v => v !== null);
            if (prevArr.length) prevValue = prevArr[prevArr.length - 1];
        }
    } else if (latestValue !== null && anual) {
        const yIdx = selectedYears.indexOf(latestYear);
        if (yIdx > 0) {
            for (let i = yIdx - 1; i >= 0; i--) {
                if (series[selectedYears[i]] !== null) { prevValue = series[selectedYears[i]]; break; }
            }
        }
    }

    const avg = allValues.length ? allValues.reduce((a, b) => a + b, 0) / allValues.length : null;
    const max = allValues.length ? Math.max(...allValues) : null;
    const min = allValues.length ? Math.min(...allValues) : null;
    const delta = (latestValue !== null && prevValue !== null) ? round1(latestValue - prevValue) : null;

    return { latestYear, latestValue, delta, avg, max, min };
}

/* Anima um número de "from" até "to" */
function animateNumber(el, from, to, suffix, decimals) {
    const duration = 550;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = from + (to - from) * eased;
        el.textContent = `${decimals ? value.toFixed(decimals) : Math.round(value)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

function renderKpis(series, selectedYears, anual) {
    if (selectedYears.length === 0) {
        els.kpiRow.innerHTML = "";
        return;
    }

    const k = computeKpis(series, selectedYears, anual);
    const noData = k.latestValue === null;

    const cards = [
        {
            label: anual ? `Valor atual (${k.latestYear || "—"})` : `Valor atual (${k.latestYear || "—"} · último período)`,
            value: noData ? 0 : k.latestValue,
            suffix: noData ? "" : "%",
            display: noData ? "Sem dado" : null,
            decimals: 1,
            sub: k.delta === null ? null : {
                text: `${k.delta >= 0 ? "▲" : "▼"} ${Math.abs(k.delta)} p.p. vs período anterior`,
                cls: k.delta >= 0 ? "positive" : "negative"
            }
        },
        { label: "Média do período", value: k.avg === null ? 0 : k.avg, suffix: k.avg === null ? "" : "%", display: k.avg === null ? "—" : null, decimals: 1, sub: null },
        { label: "Máximo", value: k.max === null ? 0 : k.max, suffix: k.max === null ? "" : "%", display: k.max === null ? "—" : null, decimals: 1, sub: null },
        { label: "Mínimo", value: k.min === null ? 0 : k.min, suffix: k.min === null ? "" : "%", display: k.min === null ? "—" : null, decimals: 1, sub: null }
    ];

    els.kpiRow.innerHTML = "";
    cards.forEach((c, i) => {
        const card = document.createElement("div");
        card.className = "kpi-card";
        card.style.animationDelay = `${i * 60}ms`;
        card.innerHTML = `
            <div class="kpi-label">${c.label}</div>
            <div class="kpi-value" data-value="${c.value}">${c.display ? c.display : `0${c.suffix}`}</div>
            ${c.sub ? `<div class="kpi-sub ${c.sub.cls}">${c.sub.text}</div>` : ""}
        `;
        els.kpiRow.appendChild(card);
        if (!c.display) {
            const valueEl = card.querySelector(".kpi-value");
            animateNumber(valueEl, 0, c.value, c.suffix, c.decimals);
        }
    });
}

/* ---------- SEMÁFORO DE RISCO ---------- */

function renderSemaforo(code, latestValue) {
    const ind = dashboardData[code];
    let level = "neutro", label;

    if (latestValue === null || latestValue === undefined) {
        label = "Sem dado disponível no período";
    } else if (ind.coletasValidas < 15) {
        label = `Meta ainda não definida (${ind.coletasValidas}/15 coletas válidas)`;
    } else {
        const bom = ind.sentidoBom;
        if (bom === "baixo") {
            if (latestValue <= ind.meta) level = "verde";
            else if (latestValue <= ind.limiteAceitavel) level = "amarelo";
            else level = "vermelho";
        } else {
            if (latestValue >= ind.meta) level = "verde";
            else if (latestValue >= ind.limiteAceitavel) level = "amarelo";
            else level = "vermelho";
        }
        label = { verde: "Dentro da meta", amarelo: "Atenção — dentro da faixa aceitável", vermelho: "Fora da faixa aceitável" }[level];
    }

    els.semaforo.className = `semaforo-badge ${level}`;
    els.semaforo.innerHTML = `<span class="semaforo-dot"></span>${label}`;

    if (ind.coletasValidas >= 15 && ind.meta !== null) {
        els.metaInfo.textContent = `Meta: ${ind.sentidoBom === "baixo" ? "≤" : "≥"} ${ind.meta}% · Faixa aceitável até ${ind.limiteAceitavel}%`;
    } else {
        els.metaInfo.textContent = `Metas e limites de aceitabilidade serão definidos após 15 coletas válidas, conforme recomendação do documento de requisitos (atualmente: ${ind.coletasValidas}/15).`;
    }
}

/* ---------- QUALIDADE DO DADO ---------- */

function renderQualidade(code) {
    const ind = dashboardData[code];
    const violations = validateIndicator(code);
    const coletaOk = ind.coletasValidas >= 15;
    const latestStatus = isAnual(code) ? anualStatus["2026"] : quadStatus["2026"][1];

    els.qualidadeBody.innerHTML = `
        <div class="qualidade-item"><span class="qualidade-label">Coletas válidas (histórico)</span><span class="qualidade-value ${coletaOk ? "ok" : "warn"}">${ind.coletasValidas}/15</span></div>
        <div class="qualidade-item"><span class="qualidade-label">Definição de meta (regra ≥15 coletas)</span><span class="qualidade-value ${coletaOk ? "ok" : "warn"}">${coletaOk ? "Habilitada" : "Aguardando"}</span></div>
        <div class="qualidade-item"><span class="qualidade-label">Status do período mais recente (2026)</span><span class="status-chip ${latestStatus}">${capitalize(latestStatus)}</span></div>
        <div class="qualidade-item"><span class="qualidade-label">Inconsistências detectadas</span><span class="qualidade-value ${violations > 0 ? "bad" : "ok"}">${violations}</span></div>
        <div class="qualidade-item"><span class="qualidade-label">Fonte dos dados</span><span class="qualidade-value">SharePoint Corporativo</span></div>
        <div class="qualidade-item"><span class="qualidade-label">Frequência de atualização</span><span class="qualidade-value">Imediata após validação (D+5)</span></div>
    `;
}

/* ---------- METODOLOGIA & OBSERVAÇÕES ---------- */

function renderMetodologia(code) {
    const ind = dashboardData[code];
    els.metodologiaBody.innerHTML = `
        <div class="metodologia-row"><b>Periodicidade</b><span>${ind.periodicidade}</span></div>
        <div class="metodologia-row"><b>Granularidade</b><span>${ind.granularidade}</span></div>
        <div class="metodologia-row"><b>Fórmula</b><span>${ind.formula}</span></div>
        <div style="margin-top:10px;">
            ${ind.observacao
                ? `<div class="observacao-text">⚠️ ${ind.observacao}</div>`
                : `<div class="observacao-empty">Nenhuma observação ou ressalva registrada para este indicador.</div>`}
        </div>
    `;
}

/* ---------- LEGEND ---------- */

function renderLegend(selectedYears) {
    els.legend.innerHTML = "";
    selectedYears.forEach((year, i) => {
        const item = document.createElement("div");
        item.className = "legend-item";
        item.style.animationDelay = `${i * 50}ms`;
        item.innerHTML = `<span class="legend-swatch" style="background:${yearColors[year]}"></span>${year}`;
        els.legend.appendChild(item);
    });
}

/* ---------- MAIN CHART ---------- */

function getBarWidth(count) {
    const widths = { 1: 44, 2: 30, 3: 22, 4: 16 };
    return widths[count] || 16;
}

function buildBarTooltip(code, year, periodLabel, value, period) {
    const ind = dashboardData[code];

    if (value === null) {
        return `
            <div class="tt-title"><span class="tt-swatch" style="background:${yearColors[year]}"></span>${code} · ${year}</div>
            <div class="tt-row">${periodLabel}</div>
            <div class="tt-row">Coleta ainda não disponível (pendente)</div>
        `;
    }

    const varsHtml = [];
    const numDen = integrityPairs[code];

    Object.keys(ind.vars).forEach(vc => {
        let val;
        if (period !== undefined && period !== null) {
            val = ind.vars[vc].data[year]?.[period];
        } else {
            val = ind.vars[vc].data[year];
        }
        if (val !== null && val !== undefined) {
            const highlight = vc === numDen[0] || vc === numDen[1] ? ' style="font-weight:700"' : '';
            varsHtml.push(`<div class="tt-row"${highlight}>${vc} (${ind.vars[vc].label}): <b>${val}</b></div>`);
        }
    });

    if (numDen) {
        const numVar = numDen[0];
        const denVar = numDen[1];
        let numVal, denVal;
        if (period !== undefined && period !== null) {
            numVal = ind.vars[numVar].data[year]?.[period];
            denVal = ind.vars[denVar].data[year]?.[period];
        } else {
            numVal = ind.vars[numVar].data[year];
            if (code === "I09") {
                const v02arr = dashboardData.I01.vars.V02.data[year];
                denVal = v02arr && v02arr.every(x => x !== null) ? v02arr.reduce((a, b) => a + b, 0) : null;
            } else {
                denVal = ind.vars[denVar].data[year];
            }
        }
        if (numVal !== null && numVal !== undefined && denVal !== null && denVal !== undefined) {
            varsHtml.push(`<div class="tt-row" style="border-top:1px solid var(--border-subtle);padding-top:4px;margin-top:4px">${ind.formula}: (${numVal} / ${denVal}) × 100 = <b>${value}%</b></div>`);
        }
    }

    return `
        <div class="tt-title"><span class="tt-swatch" style="background:${yearColors[year]}"></span>${code} · ${year}</div>
        <div class="tt-row">${periodLabel}</div>
        ${varsHtml.join("")}
    `;
}

function addReferenceLines(code, series, selectedYears, anual) {
    const values = [];
    selectedYears.forEach(year => {
        if (anual) {
            const v = series[year];
            if (v !== null) values.push(v);
        } else {
            series[year].forEach(v => { if (v !== null) values.push(v); });
        }
    });

    if (values.length === 0) return;

    const avg = round1(values.reduce((a, b) => a + b, 0) / values.length);
    const max = Math.max(...values);
    const min = Math.min(...values);

    const lines = [
        { value: max, label: `Máx: ${max}%`, cls: "ref-line-max" },
        { value: avg, label: `Média: ${avg}%`, cls: "ref-line-avg" },
        { value: min, label: `Mín: ${min}%`, cls: "ref-line-min" }
    ];

    const meta = dashboardData[code].meta;
    if (meta !== null && meta !== undefined) {
        lines.push({ value: meta, label: `Meta: ${meta}%`, cls: "ref-line-meta" });
    }

    lines.forEach(({ value, label, cls }, i) => {
        const line = document.createElement("div");
        line.className = cls;
        line.style.bottom = `${value * 8}px`;
        const side = i % 2 === 0 ? "" : " left";
        line.innerHTML = `<span class="ref-line-label${side}">${label}</span>`;
        els.chart.appendChild(line);
    });
}

function renderMainChart(code, series, selectedYears, anual) {
    els.chart.innerHTML = "";
    els.quarterLabels.innerHTML = "";

    if (selectedYears.length === 0) {
        els.chart.innerHTML = "<div style='margin:auto;font-size:12px;color:var(--text-secondary)'>Selecione pelo menos 1 ano</div>";
        return;
    }

    if (anual) {
        const barWidth = getBarWidth(selectedYears.length) + 14;
        const group = document.createElement("div");
        group.className = "quarter-group";
        group.style.minWidth = "100%";

        selectedYears.forEach((year, yi) => {
            const value = series[year];
            const wrapper = document.createElement("div");
            wrapper.className = "bar-wrapper";
            wrapper.style.width = `${barWidth}px`;

            const label = document.createElement("div");
            label.className = "bar-value-label";
            label.textContent = value === null ? "s/ dado" : `${value}%`;

            const bar = document.createElement("div");
            bar.className = "dynamic-bar";
            bar.style.background = value === null ? "var(--border-subtle)" : yearColors[year];
            bar.style.width = `${barWidth}px`;
            bar.style.transitionDelay = `${yi * 40}ms`;

            const tooltipHtml = buildBarTooltip(code, year, "Fechamento anual", value, null);
            bar.addEventListener("mouseenter", e => showTooltip(e, tooltipHtml));
            bar.addEventListener("mousemove", e => positionTooltip(e));
            bar.addEventListener("mouseleave", hideTooltip);

            wrapper.appendChild(label);
            wrapper.appendChild(bar);
            group.appendChild(wrapper);

            requestAnimationFrame(() => {
                bar.style.height = value === null ? "4px" : `${value * 8}px`;
                wrapper.classList.add("show-label");
            });

            const yl = document.createElement("span");
            yl.textContent = year;
            els.quarterLabels.appendChild(yl);
        });

        els.chart.appendChild(group);
        addReferenceLines(code, series, selectedYears, anual);
        return;
    }

    /* Quadrimestral: 3 grupos (Q1, Q2, Q3) com barras por ano selecionado */
    const barWidth = getBarWidth(selectedYears.length);
    const periodLabels = ["1º Quadrimestre (Jan-Abr)", "2º Quadrimestre (Mai-Ago)", "3º Quadrimestre (Set-Dez)"];

    for (let period = 0; period < 3; period++) {
        const group = document.createElement("div");
        group.className = "quarter-group";

        selectedYears.forEach((year, yi) => {
            const value = series[year][period];

            const wrapper = document.createElement("div");
            wrapper.className = "bar-wrapper";
            wrapper.style.width = `${barWidth}px`;

            const label = document.createElement("div");
            label.className = "bar-value-label";
            label.textContent = value === null ? "s/ dado" : `${value}%`;

            const bar = document.createElement("div");
            bar.className = "dynamic-bar";
            bar.style.background = value === null ? "var(--border-subtle)" : yearColors[year];
            bar.style.width = `${barWidth}px`;
            bar.style.transitionDelay = `${(period * selectedYears.length + yi) * 25}ms`;

            const tooltipHtml = buildBarTooltip(code, year, periodLabels[period], value, period);
            bar.addEventListener("mouseenter", e => showTooltip(e, tooltipHtml));
            bar.addEventListener("mousemove", e => positionTooltip(e));
            bar.addEventListener("mouseleave", hideTooltip);

            wrapper.appendChild(label);
            wrapper.appendChild(bar);
            group.appendChild(wrapper);

            requestAnimationFrame(() => {
                bar.style.height = value === null ? "4px" : `${value * 8}px`;
                wrapper.classList.add("show-label");
            });
        });

        els.chart.appendChild(group);

        const label = document.createElement("span");
        label.textContent = `Q${period + 1}`;
        els.quarterLabels.appendChild(label);
    }

    addReferenceLines(code, series, selectedYears, anual);

    const elsChart = els.chart;

    const footer = document.createElement("div");
    footer.className = "chart-footer";

    const periodRow = document.createElement("div");
    periodRow.className = "chart-footer-periods";
    const qLabels = els.quarterLabels.querySelectorAll("span");
    qLabels.forEach(span => {
        const clone = document.createElement("span");
        clone.textContent = span.textContent;
        periodRow.appendChild(clone);
    });
    footer.appendChild(periodRow);

    const infoRow = document.createElement("div");
    infoRow.className = "chart-footer-info";
    infoRow.textContent = `${els.formula.textContent} · ${els.metaInfo.textContent}`;
    footer.appendChild(infoRow);

    elsChart.appendChild(footer);
}

/* ---------- VARS CHART (variáveis brutas do último período disponível) ---------- */

function getLatestVarSnapshot(code) {
    const ind = dashboardData[code];
    const rows = [];

    if (isAnual(code)) {
        for (let i = YEARS.length - 1; i >= 0; i--) {
            const year = YEARS[i];
            const allPresent = Object.keys(ind.vars).every(vc => ind.vars[vc].data[year] !== null);
            if (allPresent || code === "I09") {
                Object.keys(ind.vars).forEach(vc => {
                    const val = ind.vars[vc].data[year];
                    if (val !== null && val !== undefined) rows.push({ code: vc, label: ind.vars[vc].label, value: val, year, period: null });
                });
                if (code === "I09") {
                    const v02arr = dashboardData.I01.vars.V02.data[year];
                    if (v02arr && v02arr.every(x => x !== null)) {
                        rows.push({ code: "V02", label: "Total de denúncias (ano, agregado)", value: v02arr.reduce((a, b) => a + b, 0), year, period: null });
                    }
                }
                if (rows.length) return rows;
            }
        }
        return rows;
    }

    for (let i = YEARS.length - 1; i >= 0; i--) {
        const year = YEARS[i];
        for (let p = 2; p >= 0; p--) {
            const allPresent = Object.keys(ind.vars).every(vc => ind.vars[vc].data[year][p] !== null);
            if (allPresent) {
                Object.keys(ind.vars).forEach(vc => {
                    rows.push({ code: vc, label: ind.vars[vc].label, value: ind.vars[vc].data[year][p], year, period: p });
                });
                return rows;
            }
        }
    }
    return rows;
}

function renderVarsChart(code) {
    els.varsChart.innerHTML = "";
    const rows = getLatestVarSnapshot(code);
    if (!rows.length) {
        els.varsChart.innerHTML = "<div style='font-size:12px;color:var(--text-secondary)'>Sem dados disponíveis.</div>";
        return;
    }

    const refLabel = rows[0].period === null ? `${rows[0].year}` : `${rows[0].year} · Q${rows[0].period + 1}`;
    const maxVal = Math.max(...rows.map(v => v.value));

    rows.forEach((variable, index) => {
        const row = document.createElement("div");
        row.className = "h-row";
        row.style.animationDelay = `${index * 70}ms`;

        const pct = maxVal > 0 ? (variable.value / maxVal) * 100 : 0;

        row.innerHTML = `
            <div class="h-label">
                <span class="h-code">${variable.code}</span>
                <span class="h-desc">${variable.label}</span>
            </div>
            <div class="h-track"><div class="h-bar" style="width:0%"></div></div>
            <div class="h-value">${variable.value}</div>
        `;

        const bar = row.querySelector(".h-bar");
        const tooltipHtml = `
            <div class="tt-title"><span class="tt-swatch" style="background:${varColor}"></span>${variable.code} · ${refLabel}</div>
            <div class="tt-row">${variable.label}</div>
            <div class="tt-row">Valor: <b>${variable.value}</b></div>
        `;

        bar.addEventListener("mouseenter", e => showTooltip(e, tooltipHtml));
        bar.addEventListener("mousemove", e => positionTooltip(e));
        bar.addEventListener("mouseleave", hideTooltip);

        els.varsChart.appendChild(row);
        requestAnimationFrame(() => { bar.style.width = `${pct}%`; });
    });
}

/* ---------- TABLE ---------- */

function renderTable(code, series, selectedYears, anual) {
    els.tableBody.innerHTML = "";
    els.periodHeader.textContent = anual ? "Fechamento" : "Quadrimestre";

    let rowIndex = 0;

    selectedYears.forEach(year => {
        if (anual) {
            const value = series[year];
            const status = anualStatus[year];
            const tr = document.createElement("tr");
            tr.style.animationDelay = `${rowIndex * 30}ms`;
            tr.innerHTML = `
                <td><span class="year-chip"><span class="dot" style="background:${yearColors[year]}"></span>${year}</span></td>
                <td>Anual</td>
                <td class="num">${value === null ? "—" : `${value}%`}</td>
                <td class="num">—</td>
                <td><span class="status-chip ${status}">${capitalize(status)}</span></td>
            `;
            els.tableBody.appendChild(tr);
            rowIndex++;
            return;
        }

        const values = series[year];
        const statusArr = quadStatus[year];
        values.forEach((value, period) => {
            const prev = period > 0 ? values[period - 1] : null;
            const delta = (prev === null || value === null) ? null : round1(value - prev);

            const tr = document.createElement("tr");
            tr.style.animationDelay = `${rowIndex * 30}ms`;
            tr.innerHTML = `
                <td><span class="year-chip"><span class="dot" style="background:${yearColors[year]}"></span>${year}</span></td>
                <td>${period + 1}º Quadrimestre</td>
                <td class="num">${value === null ? "—" : `${value}%`}</td>
                <td class="num">${delta === null ? "—" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)} p.p.`}</td>
                <td><span class="status-chip ${statusArr[period]}">${capitalize(statusArr[period])}</span></td>
            `;
            els.tableBody.appendChild(tr);
            rowIndex++;
        });
    });
}

/* ---------- MAIN RENDER ---------- */

function renderDashboard(code) {
    const selectedYears = getSelectedYears();
    const ind = dashboardData[code];
    const anual = isAnual(code);
    const series = buildSeries(code);

    els.mainChartTitle.textContent = anual ? "Evolução Anual" : "Evolução Quadrimestral";
    els.formula.textContent = `Fórmula: ${ind.formula}`;

    const k = computeKpis(series, selectedYears.length ? selectedYears : YEARS, anual);

    renderKpis(series, selectedYears, anual);
    renderSemaforo(code, k.latestValue);
    renderLegend(selectedYears);
    renderMainChart(code, series, selectedYears, anual);
    renderVarsChart(code);
    renderQualidade(code);
    renderMetodologia(code);
    renderTable(code, series, selectedYears, anual);
}

syncPillState();
renderDashboard("I01");

/* ---------- VISUAL TOOLBAR (estilo Power BI) ---------- */

const ICONS = {
    filter: `<svg viewBox="0 0 24 24"><path d="M4 5h16l-6 8v6l-4-2v-4L4 5z"/></svg>`,
    expand: `<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
    more: `<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/></svg>`,
    exportIcon: `<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>`,
    table: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M9 4v16"/></svg>`,
    remove: `<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>`,
    highlight: `<svg viewBox="0 0 24 24"><path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z"/></svg>`,
    sortDesc: `<svg viewBox="0 0 24 24"><path d="M4 6h10M4 12h7M4 18h4M17 4v16M17 20l4-4M17 20l-4-4"/></svg>`,
    sortAsc: `<svg viewBox="0 0 24 24"><path d="M4 18h10M4 12h7M4 6h4M17 20V4M17 4l4 4M17 4l-4 4"/></svg>`,
    sortBy: `<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h10M4 17h6"/></svg>`,
    calc: `<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h2M13 12h3M8 16h2M13 16h3"/></svg>`,
    check: `<svg viewBox="0 0 24 24" style="stroke:var(--accent)"><path d="M20 6L9 17l-5-5"/></svg>`
};

const toolbarState = {};

function buildVisualMenuHTML(targetId) {
    const state = toolbarState[targetId] || { sort: null };
    return `
        <div class="visual-menu-item" data-action="export">${ICONS.exportIcon}<span>Exportar dados</span></div>
        <div class="visual-menu-item" data-action="table">${ICONS.table}<span>Mostrar como uma tabela</span></div>
        <div class="visual-menu-item danger" data-action="remove">${ICONS.remove}<span>Remover</span></div>
        <div class="visual-menu-item" data-action="highlight">${ICONS.highlight}<span>Destaque</span></div>
        <div class="visual-menu-divider"></div>
        <div class="visual-menu-item" data-action="sort-desc"><span class="check">${state.sort === "desc" ? "✓" : ""}</span>${ICONS.sortDesc}<span>Classificar em ordem decrescente</span></div>
        <div class="visual-menu-item" data-action="sort-asc"><span class="check">${state.sort === "asc" ? "✓" : ""}</span>${ICONS.sortAsc}<span>Classificar em ordem crescente</span></div>
        <div class="visual-menu-item" data-action="sort-by">${ICONS.sortBy}<span>Classificar por</span><span class="chevron">›</span></div>
        <div class="visual-menu-divider"></div>
        <div class="visual-menu-item" data-action="new-calc">${ICONS.calc}<span>Novo cálculo do visual</span><span class="chevron">›</span></div>
        <div class="visual-menu-divider"></div>
        <div class="visual-menu-item" data-action="verified"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg><span>Configurar uma resposta verificada (versão prévia)</span></div>
    `;
}

function closeAllVisualMenus() {
    document.querySelectorAll(".visual-menu.open").forEach(m => m.classList.remove("open"));
    document.querySelectorAll(".visual-toolbar.menu-open").forEach(t => t.classList.remove("menu-open"));
}

function toggleTableView(targetId) {
    const toolbar = document.querySelector(`.visual-toolbar[data-target="${targetId}"]`);
    if (!toolbar) return;
    const card = toolbar.closest(".chart-card");
    const isTable = card.classList.toggle("visual-as-table");

    if (targetId === "mainChart") {
        const chartEl = document.getElementById("mainChart");
        const labelsEl = document.getElementById("quarterLabels");
        if (isTable) {
            card._savedChartHTML = chartEl.innerHTML;
            card._savedLabelsHTML = labelsEl.innerHTML;
            chartEl.innerHTML = buildMainTableHTML();
            labelsEl.innerHTML = "";
        } else {
            chartEl.innerHTML = card._savedChartHTML || "";
            labelsEl.innerHTML = card._savedLabelsHTML || "";
        }
        return;
    }

    if (targetId === "varsChart") {
        const chartEl = document.getElementById("varsChart");
        if (isTable) {
            card._savedVarsHTML = chartEl.innerHTML;
            chartEl.innerHTML = buildVarsTableHTML();
        } else {
            chartEl.innerHTML = card._savedVarsHTML || "";
        }
    }
}

function buildMainTableHTML() {
    const code = currentIndicator;
    const anual = isAnual(code);
    const series = buildSeries(code);
    const selectedYears = getSelectedYears();

    let html = `<table class="data-table" style="font-size:12px;width:100%"><thead><tr>
        <th>Ano</th>${anual ? "" : "<th>Quadrimestre</th>"}
        <th class="num">Valor</th>
        <th class="num">Variação</th>
        <th>Status</th>
    </tr></thead><tbody>`;

    let rowIndex = 0;
    selectedYears.forEach(year => {
        if (anual) {
            const value = series[year];
            const status = anualStatus[year];
            html += `<tr style="animation:tableRowEnter .3s both;animation-delay:${rowIndex * 30}ms">
                <td><span class="year-chip"><span class="dot" style="background:${yearColors[year]}"></span>${year}</span></td>
                <td class="num">${value === null ? "—" : `${value}%`}</td>
                <td class="num">—</td>
                <td><span class="status-chip ${status}">${capitalize(status)}</span></td>
            </tr>`;
            rowIndex++;
        } else {
            const values = series[year];
            const statusArr = quadStatus[year];
            values.forEach((value, period) => {
                const prev = period > 0 ? values[period - 1] : null;
                const delta = (prev === null || value === null) ? null : round1(value - prev);
                html += `<tr style="animation:tableRowEnter .3s both;animation-delay:${rowIndex * 30}ms">
                    <td><span class="year-chip"><span class="dot" style="background:${yearColors[year]}"></span>${year}</span></td>
                    <td>${period + 1}º Quadrimestre</td>
                    <td class="num">${value === null ? "—" : `${value}%`}</td>
                    <td class="num">${delta === null ? "—" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)} p.p.`}</td>
                    <td><span class="status-chip ${statusArr[period]}">${capitalize(statusArr[period])}</span></td>
                </tr>`;
                rowIndex++;
            });
        }
    });

    html += "</tbody></table>";
    return html;
}

function buildVarsTableHTML() {
    const code = currentIndicator;
    const rows = getLatestVarSnapshot(code);
    if (!rows.length) return "<div style='font-size:12px;color:var(--text-secondary);padding:20px 0'>Sem dados disponíveis.</div>";

    const refLabel = rows[0].period === null ? `${rows[0].year}` : `${rows[0].year} · Q${rows[0].period + 1}`;
    let html = `<div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px">Referência: ${refLabel}</div>`;
    html += `<table class="data-table" style="font-size:12px;width:100%"><thead><tr>
        <th>Código</th>
        <th>Descrição</th>
        <th class="num">Valor</th>
    </tr></thead><tbody>`;

    rows.forEach((v, i) => {
        html += `<tr style="animation:tableRowEnter .3s both;animation-delay:${i * 30}ms">
            <td><strong>${v.code}</strong></td>
            <td>${v.label}</td>
            <td class="num">${v.value}</td>
        </tr>`;
    });

    html += "</tbody></table>";
    return html;
}

function exportVisualData(targetId) {
    const code = currentIndicator;
    const anual = isAnual(code);
    const series = buildSeries(code);
    const selectedYears = getSelectedYears();

    let csv = anual ? "Ano,Status,Valor\n" : "Ano,Quadrimestre,Status,Valor\n";
    selectedYears.forEach(year => {
        if (anual) {
            csv += `${year},${anualStatus[year]},${series[year] === null ? "" : series[year]}\n`;
        } else {
            series[year].forEach((v, p) => {
                csv += `${year},Q${p + 1},${quadStatus[year][p]},${v === null ? "" : v}\n`;
            });
        }
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${code}_dados.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function toggleExpand(targetId) {
    const toolbar = document.querySelector(`.visual-toolbar[data-target="${targetId}"]`);
    if (!toolbar) return;
    const card = toolbar.closest(".chart-card");
    card.classList.toggle("expandido");
    let overlay = document.getElementById("expandOverlay");
    if (card.classList.contains("expandido")) {
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "expandOverlay";
            overlay.style.cssText = "position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.4)";
            overlay.addEventListener("click", () => toggleExpand(targetId));
            document.body.appendChild(overlay);
        }
        overlay.style.display = "block";
        document.addEventListener("keydown", closeExpandOnEscape);
    } else {
        if (overlay) overlay.style.display = "none";
        document.removeEventListener("keydown", closeExpandOnEscape);
    }

    function closeExpandOnEscape(e) {
        if (e.key === "Escape") {
            card.classList.remove("expandido");
            if (overlay) overlay.style.display = "none";
            document.removeEventListener("keydown", closeExpandOnEscape);
        }
    }
}

function removeVisual(targetId) {
    const toolbar = document.querySelector(`.visual-toolbar[data-target="${targetId}"]`);
    if (!toolbar) return;
    const card = toolbar.closest(".chart-card");
    card.classList.add("visual-hidden");
    card.addEventListener("click", function restore() {
        if (card.classList.contains("visual-hidden")) {
            card.classList.remove("visual-hidden");
            card.removeEventListener("click", restore);
        }
    });
}

function handleVisualSort(targetId, direction) {
    toolbarState[targetId] = toolbarState[targetId] || {};
    toolbarState[targetId].sort = direction;
    if (targetId === "mainChart") renderDashboard(currentIndicator);
}

function initVisualToolbars() {
    document.querySelectorAll(".visual-toolbar").forEach(toolbar => {
        const targetId = toolbar.dataset.target;

        toolbar.innerHTML = `
            <button class="toolbar-btn" data-btn="filter" title="Filtro">${ICONS.filter}</button>
            <button class="toolbar-btn" data-btn="expand" title="Expandir">${ICONS.expand}</button>
            <button class="toolbar-btn" data-btn="more" title="Mais opções">${ICONS.more}</button>
        `;

        const menu = document.createElement("div");
        menu.className = "visual-menu";
        menu.innerHTML = buildVisualMenuHTML(targetId);
        toolbar.closest(".chart-card").style.position = "relative";
        toolbar.closest(".chart-card").appendChild(menu);

        toolbar.querySelector('[data-btn="expand"]').addEventListener("click", (e) => {
            e.stopPropagation();
            toggleExpand(targetId);
        });

        toolbar.querySelector('[data-btn="more"]').addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.contains("open");
            closeAllVisualMenus();
            if (!isOpen) {
                menu.classList.add("open");
                toolbar.classList.add("menu-open");
            }
        });

        menu.addEventListener("click", (e) => {
            const item = e.target.closest(".visual-menu-item");
            if (!item) return;
            const action = item.dataset.action;
            switch (action) {
                case "export": exportVisualData(targetId); break;
                case "table": toggleTableView(targetId); break;
                case "remove": removeVisual(targetId); break;
                case "sort-desc": handleVisualSort(targetId, "desc"); break;
                case "sort-asc": handleVisualSort(targetId, "asc"); break;
                default: break;
            }
            closeAllVisualMenus();
        });
    });

    document.addEventListener("click", closeAllVisualMenus);
}

document.addEventListener("DOMContentLoaded", initVisualToolbars);