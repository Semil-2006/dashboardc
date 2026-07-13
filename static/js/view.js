/* =========================================================================
   VIEW — Renderização e manipulação do DOM
   ========================================================================= */

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
    indicesChart: document.getElementById("indicesChart"),
    qualidadeBody: document.getElementById("qualidadeBody"),
    metodologiaBody: document.getElementById("metodologiaBody"),
    tableBody: document.getElementById("dataTableBody"),
    periodHeader: document.getElementById("periodHeader"),
    ttip: document.getElementById("ttip")
};

function showTooltip(evt, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    els.ttip.replaceChildren(...doc.body.childNodes);
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

function syncPillState() {
    document.querySelectorAll(".year-pill").forEach(pill => {
        const checked = pill.querySelector(".year-checkbox").checked;
        pill.classList.toggle("checked", checked);
    });
}

function renderKpis(series, selectedYears, anual) {
    if (selectedYears.length === 0) {
        els.kpiRow.replaceChildren();
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

    els.kpiRow.replaceChildren();
    cards.forEach((c, i) => {
        const card = document.createElement("div");
        card.className = "kpi-card";
        card.style.animationDelay = `${i * 60}ms`;

        const label = document.createElement("div");
        label.className = "kpi-label";
        label.textContent = c.label;
        card.appendChild(label);

        const valueEl = document.createElement("div");
        valueEl.className = "kpi-value";
        valueEl.setAttribute("data-value", c.value);
        valueEl.textContent = c.display ? c.display : `0${c.suffix}`;
        card.appendChild(valueEl);

        if (c.sub) {
            const sub = document.createElement("div");
            sub.className = `kpi-sub ${c.sub.cls}`;
            sub.textContent = c.sub.text;
            card.appendChild(sub);
        }

        els.kpiRow.appendChild(card);
        if (!c.display) {
            const valueEl = card.querySelector(".kpi-value");
            animateNumber(valueEl, 0, c.value, c.suffix, c.decimals);
        }
    });
}

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
    els.semaforo.replaceChildren();

    const dot = document.createElement("span");
    dot.className = "semaforo-dot";
    els.semaforo.appendChild(dot);

    const labelText = document.createTextNode(label);
    els.semaforo.appendChild(labelText);

    if (ind.coletasValidas >= 15 && ind.meta !== null) {
        els.metaInfo.textContent = `Meta: ${ind.sentidoBom === "baixo" ? "≤" : "≥"} ${ind.meta}% · Faixa aceitável até ${ind.limiteAceitavel}%`;
    } else {
        els.metaInfo.textContent = `Metas e limites de aceitabilidade serão definidos após 15 coletas válidas, conforme recomendação do documento de requisitos (atualmente: ${ind.coletasValidas}/15).`;
    }
}

function renderQualidade(code) {
    const ind = dashboardData[code];
    const violations = validateIndicator(code);
    const coletaOk = ind.coletasValidas >= 15;
    const latestStatus = isAnual(code) ? anualStatus["2026"] : quadStatus["2026"][1];

    const htmlString = `
        <div class="qualidade-item"><span class="qualidade-label">Coletas válidas (histórico)</span><span class="qualidade-value ${coletaOk ? "ok" : "warn"}">${ind.coletasValidas}/15</span></div>
        <div class="qualidade-item"><span class="qualidade-label">Definição de meta (regra ≥15 coletas)</span><span class="qualidade-value ${coletaOk ? "ok" : "warn"}">${coletaOk ? "Habilitada" : "Aguardando"}</span></div>
        <div class="qualidade-item"><span class="qualidade-label">Status do período mais recente (2026)</span><span class="status-chip ${latestStatus}">${capitalize(latestStatus)}</span></div>
        <div class="qualidade-item"><span class="qualidade-label">Inconsistências detectadas</span><span class="qualidade-value ${violations > 0 ? "bad" : "ok"}">${violations}</span></div>
        <div class="qualidade-item"><span class="qualidade-label">Fonte dos dados</span><span class="qualidade-value">SharePoint Corporativo</span></div>
        <div class="qualidade-item"><span class="qualidade-label">Frequência de atualização</span><span class="qualidade-value">Imediata após validação (D+5)</span></div>
    `;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    els.qualidadeBody.replaceChildren(...doc.body.childNodes);
}

function renderMetodologia(code) {
    const ind = dashboardData[code];
    const htmlString = `
        <div class="metodologia-row"><b>Periodicidade</b><span>${ind.periodicidade}</span></div>
        <div class="metodologia-row"><b>Granularidade</b><span>${ind.granularidade}</span></div>
        <div class="metodologia-row"><b>Fórmula</b><span>${ind.formula}</span></div>
        <div style="margin-top:10px;">
            ${ind.observacao
                ? `<div class="observacao-text">⚠️ ${ind.observacao}</div>`
                : `<div class="observacao-empty">Nenhuma observação ou ressalva registrada para este indicador.</div>`}
        </div>
    `;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    els.metodologiaBody.replaceChildren(...doc.body.childNodes);
}

function renderLegend(selectedYears) {
    els.legend.replaceChildren();
    selectedYears.forEach((year, i) => {
        const item = document.createElement("div");
        item.className = "legend-item";
        item.style.animationDelay = `${i * 50}ms`;

        const swatch = document.createElement("span");
        swatch.className = "legend-swatch";
        swatch.style.background = yearColors[year];
        item.appendChild(swatch);

        const yearText = document.createTextNode(year);
        item.appendChild(yearText);

        els.legend.appendChild(item);
    });
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

function addReferenceLines(code, series, selectedYears, anual, multiplier) {
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
        line.style.bottom = `${42 + value * multiplier}px`;
        const side = i % 2 === 0 ? "" : " left";

        const span = document.createElement("span");
        span.className = `ref-line-label${side}`;
        span.textContent = label;

        line.appendChild(span);
        els.chart.appendChild(line);
    });
}

function renderMainChart(code, series, selectedYears, anual) {
    els.chart.replaceChildren();
    els.quarterLabels.replaceChildren();

    if (selectedYears.length === 0) {
        const msg = document.createElement("div");
        msg.style.margin = "auto";
        msg.style.fontSize = "12px";
        msg.style.color = "var(--text-secondary)";
        msg.textContent = "Selecione pelo menos 1 ano";
        els.chart.appendChild(msg);
        return;
    }

    const containerHeight = els.chart.clientHeight || 450;
    const contentHeight = containerHeight - 42;
    const multiplier = contentHeight / 100;

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
            bar.style.position = "relative";
            bar.style.transitionDelay = `${yi * 40}ms`;

            const innerLabel = document.createElement("div");
            innerLabel.className = "bar-value-inner";
            innerLabel.textContent = value === null ? "" : `${value}%`;
            bar.appendChild(innerLabel);

            const tooltipHtml = buildBarTooltip(code, year, "Fechamento anual", value, null);
            bar.addEventListener("mouseenter", e => showTooltip(e, tooltipHtml));
            bar.addEventListener("mousemove", e => positionTooltip(e));
            bar.addEventListener("mouseleave", hideTooltip);

            wrapper.appendChild(label);
            wrapper.appendChild(bar);
            group.appendChild(wrapper);

            requestAnimationFrame(() => {
                const rawHeight = value === null ? 4 : value * multiplier;
                const minH = value !== null && value * multiplier < 30 ? 30 : 0;
                bar.style.height = value === null ? "4px" : `${Math.max(rawHeight, minH)}px`;
                if (value !== null && rawHeight < 30) bar.dataset.small = "true";
                wrapper.classList.add("show-label");
            });

            const yl = document.createElement("span");
            yl.textContent = year;
            els.quarterLabels.appendChild(yl);
        });

        els.chart.appendChild(group);
        addReferenceLines(code, series, selectedYears, anual, multiplier);
        return;
    }

    const barWidth = getBarWidth(selectedYears.length);
    const periodLabels = ["1º Quadrimestre (Jan-Abr)", "2º Quadrimestre (Mai-Ago)", "3º Quadrimestre (Set-Dez)"];

    // Find max value among all periods/years to scale bars
    let maxValue = 0;
    for (let p = 0; p < 3; p++) {
        selectedYears.forEach(year => {
            const v = series[year][p];
            if (v !== null && v > maxValue) maxValue = v;
        });
    }
    const halfHeight = (containerHeight - 42) / 2;
    const quadMultiplier = maxValue > 0 ? halfHeight / maxValue : 1;

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
            bar.style.position = "relative";
            bar.style.transitionDelay = `${(period * selectedYears.length + yi) * 25}ms`;

            const innerLabel = document.createElement("div");
            innerLabel.className = "bar-value-inner";
            innerLabel.textContent = value === null ? "" : `${value}%`;
            bar.appendChild(innerLabel);

            const tooltipHtml = buildBarTooltip(code, year, periodLabels[period], value, period);
            bar.addEventListener("mouseenter", e => showTooltip(e, tooltipHtml));
            bar.addEventListener("mousemove", e => positionTooltip(e));
            bar.addEventListener("mouseleave", hideTooltip);

            wrapper.appendChild(label);
            wrapper.appendChild(bar);
            group.appendChild(wrapper);

            requestAnimationFrame(() => {
                const rawHeight = value === null ? 4 : value * quadMultiplier;
                const minH = value !== null && rawHeight < 20 ? 20 : 0;
                bar.style.height = value === null ? "4px" : `${Math.max(rawHeight, minH)}px`;
                if (value !== null && rawHeight < 20) bar.dataset.small = "true";
                wrapper.classList.add("show-label");
            });
        });

        els.chart.appendChild(group);

        const label = document.createElement("span");
        label.textContent = `Q${period + 1}`;
        els.quarterLabels.appendChild(label);
    }

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

function renderVarsChart(code) {
    els.varsChart.replaceChildren();
    const rows = getLatestVarSnapshot(code);
    if (!rows.length) {
        const msg = document.createElement("div");
        msg.style.fontSize = "12px";
        msg.style.color = "var(--text-secondary)";
        msg.textContent = "Sem dados disponíveis.";
        els.varsChart.appendChild(msg);
        return;
    }

    const refLabel = rows[0].period === null ? `${rows[0].year}` : `${rows[0].year} · Q${rows[0].period + 1}`;
    const maxVal = Math.max(...rows.map(v => v.value));

    rows.forEach((variable, index) => {
        const row = document.createElement("div");
        row.className = "h-row";
        row.style.animationDelay = `${index * 70}ms`;

        const pct = maxVal > 0 ? (variable.value / maxVal) * 100 : 0;

        const hLabel = document.createElement("div");
        hLabel.className = "h-label";

        const hCode = document.createElement("span");
        hCode.className = "h-code";
        hCode.textContent = variable.code;
        hLabel.appendChild(hCode);

        const hDesc = document.createElement("span");
        hDesc.className = "h-desc";
        hDesc.textContent = variable.label;
        hLabel.appendChild(hDesc);

        row.appendChild(hLabel);

        const hTrack = document.createElement("div");
        hTrack.className = "h-track";
        const hBar = document.createElement("div");
        hBar.className = "h-bar";
        hBar.style.width = "0%";
        hTrack.appendChild(hBar);
        row.appendChild(hTrack);

        const hValue = document.createElement("div");
        hValue.className = "h-value";
        hValue.textContent = variable.value;
        row.appendChild(hValue);

        const tooltipHtml = `
            <div class="tt-title"><span class="tt-swatch" style="background:${varColor}"></span>${variable.code} · ${refLabel}</div>
            <div class="tt-row">${variable.label}</div>
            <div class="tt-row">Valor: <b>${variable.value}</b></div>
        `;

        hBar.addEventListener("mouseenter", e => showTooltip(e, tooltipHtml));
        hBar.addEventListener("mousemove", e => positionTooltip(e));
        hBar.addEventListener("mouseleave", hideTooltip);

        els.varsChart.appendChild(row);
        requestAnimationFrame(() => {
            const minW = variable.value !== null && pct < 8 ? 8 : pct;
            hBar.style.width = minW < 8 ? `${minW}px` : `${minW}%`;
        });
    });
}

function renderIndicesChart(currentCode) {
    els.indicesChart.replaceChildren();
    const selectedYears = getSelectedYears();
    const activeYears = selectedYears.length ? selectedYears : YEARS;

    const rows = Object.keys(dashboardData).map(code => {
        const ind = dashboardData[code];
        const indSeries = buildSeries(code);
        const indK = computeKpis(indSeries, activeYears, isAnual(code));
        return {
            code: code,
            name: ind.name,
            value: indK.latestValue,
            year: indK.latestYear,
            periodicidade: ind.periodicidade
        };
    });

    const state = toolbarState["indicesChart"] || { sort: null };
    if (state.sort === "desc") {
        rows.sort((a, b) => {
            if (a.value === null) return 1;
            if (b.value === null) return -1;
            return b.value - a.value;
        });
    } else if (state.sort === "asc") {
        rows.sort((a, b) => {
            if (a.value === null) return 1;
            if (b.value === null) return -1;
            return a.value - b.value;
        });
    }

    const maxVal = 100;

    rows.forEach((indicator, index) => {
        const row = document.createElement("div");
        row.className = "h-row";
        row.style.animationDelay = `${index * 50}ms`;

        const valText = indicator.value === null ? "s/ dado" : `${indicator.value}%`;
        const pct = indicator.value === null ? 0 : Math.min(100, Math.max(0, indicator.value));

        const isCurrent = indicator.code === currentCode;

        const hLabel = document.createElement("div");
        hLabel.className = "h-label";

        const hCode = document.createElement("span");
        hCode.className = "h-code";
        hCode.textContent = indicator.code;
        if (isCurrent) {
            hCode.style.fontWeight = "700";
            hCode.style.color = "var(--accent-dark)";
        }
        hLabel.appendChild(hCode);

        const hDesc = document.createElement("span");
        hDesc.className = "h-desc";
        hDesc.style.whiteSpace = "nowrap";
        hDesc.style.overflow = "hidden";
        hDesc.style.textOverflow = "ellipsis";
        hDesc.style.maxWidth = "140px";
        hDesc.title = indicator.name;
        hDesc.textContent = indicator.name;
        hLabel.appendChild(hDesc);

        row.appendChild(hLabel);

        const hTrack = document.createElement("div");
        hTrack.className = "h-track";
        const hBar = document.createElement("div");
        hBar.className = "h-bar";
        hBar.style.width = "0%";
        hBar.style.background = isCurrent ? "var(--accent)" : "#b5c7d9";
        hTrack.appendChild(hBar);
        row.appendChild(hTrack);

        const hValue = document.createElement("div");
        hValue.className = "h-value";
        hValue.style.width = "50px";
        hValue.textContent = valText;
        row.appendChild(hValue);

        const refText = indicator.value === null 
            ? "Sem dados para o período selecionado" 
            : `${indicator.periodicidade} · Ref: ${indicator.year}`;

        const tooltipHtml = `
            <div class="tt-title"><span class="tt-swatch" style="background:${isCurrent ? 'var(--accent)' : '#b5c7d9'}"></span>${indicator.code} · ${refText}</div>
            <div class="tt-row" style="white-space: normal; max-width: 250px;">${indicator.name}</div>
            <div class="tt-row">Valor do último período: <b>${valText}</b></div>
        `;

        hBar.addEventListener("mouseenter", e => showTooltip(e, tooltipHtml));
        hBar.addEventListener("mousemove", e => positionTooltip(e));
        hBar.addEventListener("mouseleave", hideTooltip);

        hBar.addEventListener("click", () => {
            els.select.value = indicator.code;
            currentIndicator = indicator.code;
            renderDashboard(indicator.code);
        });
        hBar.style.cursor = "pointer";

        els.indicesChart.appendChild(row);
        requestAnimationFrame(() => {
            const minW = indicator.value !== null && pct < 8 ? 8 : pct;
            hBar.style.width = minW < 8 ? `${minW}px` : `${minW}%`;
        });
    });
}

function renderTable(code, series, selectedYears, anual) {
    els.tableBody.replaceChildren();
    els.periodHeader.textContent = anual ? "Fechamento" : "Quadrimestre";

    let rowIndex = 0;

    selectedYears.forEach(year => {
        if (anual) {
            const value = series[year];
            const status = anualStatus[year];
            const tr = document.createElement("tr");
            tr.style.animationDelay = `${rowIndex * 30}ms`;

            const td1 = document.createElement("td");
            const chip = document.createElement("span");
            chip.className = "year-chip";
            const dot = document.createElement("span");
            dot.className = "dot";
            dot.style.background = yearColors[year];
            chip.appendChild(dot);
            chip.appendChild(document.createTextNode(year));
            td1.appendChild(chip);
            tr.appendChild(td1);

            const td2 = document.createElement("td");
            td2.textContent = "Anual";
            tr.appendChild(td2);

            const td3 = document.createElement("td");
            td3.className = "num";
            td3.textContent = value === null ? "—" : `${value}%`;
            tr.appendChild(td3);

            const td4 = document.createElement("td");
            td4.className = "num";
            td4.textContent = "—";
            tr.appendChild(td4);

            const td5 = document.createElement("td");
            const statusChip = document.createElement("span");
            statusChip.className = `status-chip ${status}`;
            statusChip.textContent = capitalize(status);
            td5.appendChild(statusChip);
            tr.appendChild(td5);

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

            const td1 = document.createElement("td");
            const chip = document.createElement("span");
            chip.className = "year-chip";
            const dot = document.createElement("span");
            dot.className = "dot";
            dot.style.background = yearColors[year];
            chip.appendChild(dot);
            chip.appendChild(document.createTextNode(year));
            td1.appendChild(chip);
            tr.appendChild(td1);

            const td2 = document.createElement("td");
            td2.textContent = `${period + 1}º Quadrimestre`;
            tr.appendChild(td2);

            const td3 = document.createElement("td");
            td3.className = "num";
            td3.textContent = value === null ? "—" : `${value}%`;
            tr.appendChild(td3);

            const td4 = document.createElement("td");
            const td4Text = delta === null ? "—" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)} p.p.`;
            td4.className = "num";
            td4.textContent = td4Text;
            tr.appendChild(td4);

            const td5 = document.createElement("td");
            const statusChip = document.createElement("span");
            statusChip.className = `status-chip ${statusArr[period]}`;
            statusChip.textContent = capitalize(statusArr[period]);
            td5.appendChild(statusChip);
            tr.appendChild(td5);

            els.tableBody.appendChild(tr);
            rowIndex++;
        });
    });
}

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
    renderIndicesChart(code);
}
