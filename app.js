const dashboardData = {
    I01: {
        name: "Percentual de denúncias de assédio moral",
        formula: "(V01 / V02) × 100",
        data: {
            2023: [80, 65, 50, 30],
            2024: [40, 70, 60, 45],
            2025: [90, 85, 55, 35],
            2026: [60, 50, 75, 20]
        },
        vars: [180, 120, 90]
    },
    I02: {
        name: "Percentual de denúncias de assédio sexual",
        formula: "(V03 / V02) × 100",
        data: {
            2023: [15, 22, 30, 12],
            2024: [18, 40, 22, 15],
            2025: [25, 10, 18, 8],
            2026: [35, 30, 20, 15]
        },
        vars: [80, 100, 70]
    },
    I03: {
        name: "Efetividade de apuração de denúncias",
        formula: "(V04 / V02) × 100",
        data: {
            2023: [70, 72, 74, 76],
            2024: [77, 80, 79, 82],
            2025: [81, 83, 84, 85],
            2026: [88, 90, 92, 95]
        },
        vars: [220, 180, 150]
    },
    I04: {
        name: "Atendimento da Lei 6112/2018",
        formula: "(V05 / V06) × 100",
        data: {
            2023: [30, 40, 50, 60],
            2024: [60, 65, 70, 80],
            2025: [75, 82, 90, 95],
            2026: [100, 95, 98, 100]
        },
        vars: [200, 160, 110]
    },
    I05: {
        name: "Percentual de empregados treinados",
        formula: "(V07 / V08) × 100",
        data: {
            2023: [20, 35, 50, 60],
            2024: [55, 62, 68, 75],
            2025: [78, 82, 85, 90],
            2026: [92, 95, 97, 99]
        },
        vars: [250, 200, 180]
    },
    I06: {
        name: "Percentual de evasão em compliance",
        formula: "(V09 / V10) × 100",
        data: {
            2023: [10, 20, 25, 12],
            2024: [15, 22, 18, 10],
            2025: [8, 12, 16, 20],
            2026: [5, 6, 10, 8]
        },
        vars: [70, 120, 80]
    },
    I07: {
        name: "Denúncias de nepotismo",
        formula: "(V11 / V02) × 100",
        data: {
            2023: [5, 8, 12, 10],
            2024: [15, 10, 18, 12],
            2025: [8, 6, 5, 10],
            2026: [3, 4, 2, 1]
        },
        vars: [40, 30, 20]
    },
    I08: {
        name: "Conflito de interesse",
        formula: "(V12 / V02) × 100",
        data: {
            2023: [10, 14, 16, 18],
            2024: [12, 15, 20, 22],
            2025: [25, 22, 18, 14],
            2026: [8, 6, 5, 4]
        },
        vars: [90, 110, 130]
    },
    I09: {
        name: "Procedência de denúncias",
        formula: "(V13 / V02) × 100",
        data: {
            2023: [40, 45, 55, 65],
            2024: [60, 65, 68, 72],
            2025: [70, 75, 80, 82],
            2026: [85, 88, 92, 95]
        },
        vars: [150, 180, 200]
    },
    I10: {
        name: "Processos com penalidade",
        formula: "(V14 / V15) × 100",
        data: {
            2023: [25, 35, 42, 48],
            2024: [52, 60, 64, 70],
            2025: [72, 76, 82, 88],
            2026: [90, 92, 95, 100]
        },
        vars: [170, 150, 130]
    }
};

/* Paleta institucional CAESB (tons de azul) */
const yearColors = {
    2023: "#8FC7EC",
    2024: "#3E9BE0",
    2025: "#0072BC",
    2026: "#00335B"
};

const varLabels = ["V1", "V2", "V3"];
const varColor = "#0072BC";

let currentIndicator = "I01";

const els = {
    select: document.getElementById("indicatorSelect"),
    formula: document.getElementById("formula"),
    kpiRow: document.getElementById("kpiRow"),
    legend: document.getElementById("legend"),
    chart: document.getElementById("mainChart"),
    quarterLabels: document.getElementById("quarterLabels"),
    varsChart: document.getElementById("varsChart"),
    tableBody: document.getElementById("dataTableBody"),
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
    return [...document.querySelectorAll(".year-checkbox:checked")]
        .map(cb => cb.value);
}

/* ---------- KPI CALC ---------- */

function computeKpis(data, selectedYears) {
    const flatByYear = selectedYears.map(y => ({
        year: y,
        values: data.data[y]
    }));

    const allValues = flatByYear.flatMap(y => y.values);
    const latestYear = selectedYears[selectedYears.length - 1];
    const latestValues = data.data[latestYear];
    const latestValue = latestValues[latestValues.length - 1];
    const prevValue = latestValues.length > 1 ? latestValues[latestValues.length - 2] : null;

    const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);

    let delta = null;
    if (prevValue !== null) {
        delta = latestValue - prevValue;
    }

    return { latestYear, latestValue, delta, avg, max, min };
}

/* Anima um número de "from" até "to" */
function animateNumber(el, from, to, suffix, decimals) {
    const duration = 550;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const value = from + (to - from) * eased;
        el.textContent = `${decimals ? value.toFixed(decimals) : Math.round(value)}${suffix}`;
        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    }
    requestAnimationFrame(tick);
}

function renderKpis(data, selectedYears) {
    if (selectedYears.length === 0) {
        els.kpiRow.innerHTML = "";
        return;
    }

    const k = computeKpis(data, selectedYears);

    const cards = [
        {
            label: `Valor atual (${k.latestYear} Q4)`,
            value: k.latestValue,
            suffix: "%",
            decimals: 0,
            sub: k.delta === null ? null : {
                text: `${k.delta >= 0 ? "▲" : "▼"} ${Math.abs(k.delta)} p.p. vs trim. anterior`,
                cls: k.delta >= 0 ? "positive" : "negative"
            }
        },
        { label: "Média do período", value: k.avg, suffix: "%", decimals: 1, sub: null },
        { label: "Máximo", value: k.max, suffix: "%", decimals: 0, sub: null },
        { label: "Mínimo", value: k.min, suffix: "%", decimals: 0, sub: null }
    ];

    const isFirstRender = els.kpiRow.children.length === 0;

    if (isFirstRender) {
        els.kpiRow.innerHTML = "";
        cards.forEach((c, i) => {
            const card = document.createElement("div");
            card.className = "kpi-card";
            card.style.animationDelay = `${i * 60}ms`;
            card.innerHTML = `
                <div class="kpi-label">${c.label}</div>
                <div class="kpi-value" data-value="${c.value}">0${c.suffix}</div>
                ${c.sub ? `<div class="kpi-sub ${c.sub.cls}">${c.sub.text}</div>` : ""}
            `;
            els.kpiRow.appendChild(card);
            const valueEl = card.querySelector(".kpi-value");
            animateNumber(valueEl, 0, c.value, c.suffix, c.decimals);
        });
    } else {
        const cardEls = els.kpiRow.querySelectorAll(".kpi-card");
        cards.forEach((c, i) => {
            const card = cardEls[i];
            if (!card) return;
            card.querySelector(".kpi-label").textContent = c.label;
            const valueEl = card.querySelector(".kpi-value");
            const from = parseFloat(valueEl.dataset.value) || 0;
            valueEl.dataset.value = c.value;
            animateNumber(valueEl, from, c.value, c.suffix, c.decimals);

            let subEl = card.querySelector(".kpi-sub");
            if (c.sub) {
                if (!subEl) {
                    subEl = document.createElement("div");
                    card.appendChild(subEl);
                }
                subEl.className = `kpi-sub ${c.sub.cls}`;
                subEl.textContent = c.sub.text;
            } else if (subEl) {
                subEl.remove();
            }

            card.classList.remove("pulse");
            void card.offsetWidth;
            card.classList.add("pulse");
        });
    }
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

/* Largura da barra por ano selecionado: quanto menos anos, mais larga a barra */
function getBarWidth(count) {
    const widths = { 1: 44, 2: 30, 3: 22, 4: 16 };
    return widths[count] || 16;
}

function renderMainChart(indicatorCode, data, selectedYears) {
    els.chart.innerHTML = "";
    els.quarterLabels.innerHTML = "";

    if (selectedYears.length === 0) {
        els.chart.innerHTML = "<div style='margin:auto;font-size:12px;color:var(--text-secondary)'>Selecione pelo menos 1 ano</div>";
        return;
    }

    const barWidth = getBarWidth(selectedYears.length);

    for (let quarter = 0; quarter < 4; quarter++) {
        const group = document.createElement("div");
        group.className = "quarter-group";

        selectedYears.forEach((year, yi) => {
            const value = data.data[year][quarter];

            const bar = document.createElement("div");
            bar.className = "dynamic-bar";
            bar.style.background = yearColors[year];
            bar.style.width = `${barWidth}px`;
            bar.style.transitionDelay = `${(quarter * selectedYears.length + yi) * 25}ms`;

            const tooltipHtml = `
                <div class="tt-title">
                    <span class="tt-swatch" style="background:${yearColors[year]}"></span>
                    ${indicatorCode} · ${year}
                </div>
                <div class="tt-row">Trimestre: <b>Q${quarter + 1}</b></div>
                <div class="tt-row">Valor: <b>${value}%</b></div>
            `;

            bar.addEventListener("mouseenter", e => showTooltip(e, tooltipHtml));
            bar.addEventListener("mousemove", e => positionTooltip(e));
            bar.addEventListener("mouseleave", hideTooltip);

            group.appendChild(bar);

            // Height set after insertion so the CSS transition animates growth
            requestAnimationFrame(() => {
                bar.style.height = `${value * 2}px`;
            });
        });

        els.chart.appendChild(group);

        const label = document.createElement("span");
        label.textContent = `Q${quarter + 1}`;
        els.quarterLabels.appendChild(label);
    }
}

/* ---------- VARS CHART ---------- */

function renderVarsChart(data) {
    els.varsChart.innerHTML = "";
    const maxVal = Math.max(...data.vars);

    data.vars.forEach((value, index) => {
        const row = document.createElement("div");
        row.className = "h-row";
        row.style.animationDelay = `${index * 70}ms`;

        const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;

        row.innerHTML = `
            <div class="h-label">${varLabels[index]}</div>
            <div class="h-track"><div class="h-bar" style="width:0%"></div></div>
            <div class="h-value">${value}</div>
        `;

        const bar = row.querySelector(".h-bar");
        const tooltipHtml = `
            <div class="tt-title">
                <span class="tt-swatch" style="background:${varColor}"></span>
                ${varLabels[index]}
            </div>
            <div class="tt-row">Valor: <b>${value}</b></div>
        `;

        bar.addEventListener("mouseenter", e => showTooltip(e, tooltipHtml));
        bar.addEventListener("mousemove", e => positionTooltip(e));
        bar.addEventListener("mouseleave", hideTooltip);

        els.varsChart.appendChild(row);

        requestAnimationFrame(() => {
            bar.style.width = `${pct}%`;
        });
    });
}

/* ---------- TABLE ---------- */

function renderTable(data, selectedYears) {
    els.tableBody.innerHTML = "";

    let rowIndex = 0;
    selectedYears.forEach(year => {
        const values = data.data[year];
        values.forEach((value, quarter) => {
            const prev = quarter > 0 ? values[quarter - 1] : null;
            const delta = prev === null ? null : value - prev;

            const tr = document.createElement("tr");
            tr.style.animationDelay = `${rowIndex * 30}ms`;
            tr.innerHTML = `
                <td><span class="year-chip"><span class="dot" style="background:${yearColors[year]}"></span>${year}</span></td>
                <td>Q${quarter + 1}</td>
                <td class="num">${value}%</td>
                <td class="num">${delta === null ? "—" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)} p.p.`}</td>
            `;
            els.tableBody.appendChild(tr);
            rowIndex++;
        });
    });
}

/* ---------- MAIN RENDER ---------- */

function renderDashboard(indicatorCode) {
    const selectedYears = getSelectedYears();
    const data = dashboardData[indicatorCode];

    els.formula.textContent = `Fórmula: ${data.formula}`;

    renderKpis(data, selectedYears);
    renderLegend(selectedYears);
    renderMainChart(indicatorCode, data, selectedYears);
    renderVarsChart(data);
    renderTable(data, selectedYears);
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

const toolbarState = {}; // { targetId: { sort: 'desc'|'asc'|null } }

function buildVisualMenuHTML(targetId) {
    const state = toolbarState[targetId] || { sort: null };
    return `
        <div class="visual-menu-item" data-action="export">
            ${ICONS.exportIcon}<span>Exportar dados</span>
        </div>
        <div class="visual-menu-item" data-action="table">
            ${ICONS.table}<span>Mostrar como uma tabela</span>
        </div>
        <div class="visual-menu-item danger" data-action="remove">
            ${ICONS.remove}<span>Remover</span>
        </div>
        <div class="visual-menu-item" data-action="highlight">
            ${ICONS.highlight}<span>Destaque</span>
        </div>
        <div class="visual-menu-divider"></div>
        <div class="visual-menu-item" data-action="sort-desc">
            <span class="check">${state.sort === 'desc' ? '✓' : ''}</span>
            ${ICONS.sortDesc}<span>Classificar em ordem decrescente</span>
        </div>
        <div class="visual-menu-item" data-action="sort-asc">
            <span class="check">${state.sort === 'asc' ? '✓' : ''}</span>
            ${ICONS.sortAsc}<span>Classificar em ordem crescente</span>
        </div>
        <div class="visual-menu-item" data-action="sort-by">
            ${ICONS.sortBy}<span>Classificar por</span><span class="chevron">›</span>
        </div>
        <div class="visual-menu-divider"></div>
        <div class="visual-menu-item" data-action="new-calc">
            ${ICONS.calc}<span>Novo cálculo do visual</span><span class="chevron">›</span>
        </div>
        <div class="visual-menu-divider"></div>
        <div class="visual-menu-item" data-action="verified">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
            <span>Configurar uma resposta verificada (versão prévia)</span>
        </div>
    `;
}

function closeAllVisualMenus() {
    document.querySelectorAll('.visual-menu.open').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.visual-toolbar.menu-open').forEach(t => t.classList.remove('menu-open'));
}

function toggleTableView(targetId) {
    const card = document.querySelector(`.visual-toolbar[data-target="${targetId}"]`).closest('.chart-card');
    card.classList.toggle('visual-as-table');
    // placeholder: aqui poderia renderizar uma tabela no lugar do gráfico
}

function exportVisualData(targetId) {
    const data = dashboardData[currentIndicator];
    const selectedYears = getSelectedYears();
    let csv = "Ano,Trimestre,Valor\n";
    selectedYears.forEach(year => {
        data.data[year].forEach((v, q) => {
            csv += `${year},Q${q + 1},${v}\n`;
        });
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentIndicator}_dados.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function removeVisual(targetId) {
    const card = document.querySelector(`.visual-toolbar[data-target="${targetId}"]`).closest('.chart-card');
    card.classList.add('visual-hidden');
    card.addEventListener('click', function restore(e) {
        if (card.classList.contains('visual-hidden')) {
            card.classList.remove('visual-hidden');
            card.removeEventListener('click', restore);
        }
    });
}

function handleVisualSort(targetId, direction) {
    toolbarState[targetId] = toolbarState[targetId] || {};
    toolbarState[targetId].sort = direction;
    // Reordena as colunas de trimestre no gráfico principal (exemplo simples)
    if (targetId === "mainChart") {
        renderDashboard(currentIndicator); // mantém consistência; sort visual pode ser expandido aqui
    }
}

function initVisualToolbars() {
    document.querySelectorAll('.visual-toolbar').forEach(toolbar => {
        const targetId = toolbar.dataset.target;

        toolbar.innerHTML = `
            <button class="toolbar-btn" data-btn="filter" title="Filtro">${ICONS.filter}</button>
            <button class="toolbar-btn" data-btn="expand" title="Expandir">${ICONS.expand}</button>
            <button class="toolbar-btn" data-btn="more" title="Mais opções">${ICONS.more}</button>
        `;

        const menu = document.createElement("div");
        menu.className = "visual-menu";
        menu.innerHTML = buildVisualMenuHTML(targetId);
        toolbar.closest('.chart-card').style.position = "relative";
        toolbar.closest('.chart-card').appendChild(menu);

        toolbar.querySelector('[data-btn="more"]').addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.contains('open');
            closeAllVisualMenus();
            if (!isOpen) {
                menu.classList.add('open');
                toolbar.classList.add('menu-open');
            }
        });

        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.visual-menu-item');
            if (!item) return;
            const action = item.dataset.action;

            switch (action) {
                case "export": exportVisualData(targetId); break;
                case "table": toggleTableView(targetId); break;
                case "remove": removeVisual(targetId); break;
                case "sort-desc": handleVisualSort(targetId, "desc"); break;
                case "sort-asc": handleVisualSort(targetId, "asc"); break;
                default: break; // highlight, sort-by, new-calc, verified: placeholders
            }
            closeAllVisualMenus();
        });
    });

    document.addEventListener('click', closeAllVisualMenus);
}

document.addEventListener("DOMContentLoaded", initVisualToolbars);