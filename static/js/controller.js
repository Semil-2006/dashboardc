document.addEventListener("DOMContentLoaded", async () => {
    await initModel();
    await loadRiskConfig();

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

    document.querySelectorAll(".year-checkbox").forEach(box => {
        box.addEventListener("change", () => {
            syncPillState();
            renderDashboard(currentIndicator);
        });
    });

    document.querySelectorAll(".view-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".view-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            const view = tab.dataset.view;
            const indicatorsEl = document.getElementById("indicatorsContent");
            const riskMatrixEl = document.getElementById("riskMatrixSection");
            const riskRegisterEl = document.getElementById("riskRegisterSection");
            const indicatorFilter = document.getElementById("indicatorFilterGroup");
            const yearFilter = document.getElementById("yearFilterGroup");
            if (view === "indicators") {
                indicatorsEl.style.display = "";
                riskMatrixEl.classList.remove("active");
                if (riskRegisterEl) {
                    riskRegisterEl.style.display = "none";
                    riskRegisterEl.classList.remove("active");
                }
                if (indicatorFilter) indicatorFilter.style.display = "";
                if (yearFilter) yearFilter.style.display = "";
                renderDashboard(currentIndicator);
            } else if (view === "risk-matrix") {
                indicatorsEl.style.display = "none";
                riskMatrixEl.classList.add("active");
                if (riskRegisterEl) {
                    riskRegisterEl.style.display = "none";
                    riskRegisterEl.classList.remove("active");
                }
                if (indicatorFilter) indicatorFilter.style.display = "none";
                if (yearFilter) yearFilter.style.display = "none";
                clearRiskCache();
                renderRiskMatrix();
            } else if (view === "risk-quadro") {
                indicatorsEl.style.display = "none";
                riskMatrixEl.classList.remove("active");
                if (riskRegisterEl) {
                    riskRegisterEl.style.display = "";
                    riskRegisterEl.classList.add("active");
                }
                if (indicatorFilter) indicatorFilter.style.display = "none";
                if (yearFilter) yearFilter.style.display = "none";
                if (typeof renderRiskRegister === "function") {
                    renderRiskRegister();
                }
            }
        });
    });

    document.addEventListener("click", closeAllVisualMenus);
    initVisualToolbars();
    syncPillState();
    renderDashboard("I01");
    renderRiskMatrix();
    if (typeof renderRiskRegister === "function") {
        renderRiskRegister();
    }
});

function switchToIndicators(code) {
    const tab = document.querySelector('.view-tab[data-view="indicators"]');
    if (tab) tab.click();
    if (code) {
        setTimeout(() => {
            els.select.value = code;
            currentIndicator = code;
            renderDashboard(code);
        }, 50);
    }
}

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
        return;
    }

    if (targetId === "indicesChart") {
        const chartEl = document.getElementById("indicesChart");
        if (isTable) {
            card._savedIndicesHTML = chartEl.innerHTML;
            chartEl.innerHTML = buildIndicesTableHTML();
        } else {
            chartEl.innerHTML = card._savedIndicesHTML || "";
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

function buildIndicesTableHTML() {
    const selectedYears = getSelectedYears();
    const activeYears = selectedYears.length ? selectedYears : YEARS;

    let html = `<table class="data-table" style="font-size:12px;width:100%"><thead><tr>
        <th>Código</th>
        <th>Nome do Indicador</th>
        <th>Periodicidade</th>
        <th>Referência</th>
        <th class="num">Valor</th>
    </tr></thead><tbody>`;

    Object.keys(dashboardData).forEach((code, i) => {
        const ind = dashboardData[code];
        const indSeries = buildSeries(code);
        const indK = computeKpis(indSeries, activeYears, isAnual(code));
        const valText = indK.latestValue === null ? "—" : `${indK.latestValue}%`;

        html += `<tr style="animation:tableRowEnter .3s both;animation-delay:${i * 30}ms">
            <td><strong>${code}</strong></td>
            <td>${ind.name}</td>
            <td>${ind.periodicidade}</td>
            <td>${indK.latestValue === null ? "—" : indK.latestYear}</td>
            <td class="num">${valText}</td>
        </tr>`;
    });

    html += "</tbody></table>";
    return html;
}

function exportVisualData(targetId) {
    const selectedYears = getSelectedYears();

    if (targetId === "indicesChart") {
        const activeYears = selectedYears.length ? selectedYears : YEARS;
        let csv = "Código,Nome,Periodicidade,Referência,Valor\n";
        Object.keys(dashboardData).forEach(c => {
            const ind = dashboardData[c];
            const indSeries = buildSeries(c);
            const indK = computeKpis(indSeries, activeYears, isAnual(c));
            csv += `${c},"${ind.name}",${ind.periodicidade},${indK.latestValue === null ? "" : indK.latestYear},${indK.latestValue === null ? "" : indK.latestValue}\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `comparativo_indicadores.csv`;
        a.click();
        URL.revokeObjectURL(url);
        return;
    }

    const code = currentIndicator;
    const anual = isAnual(code);
    const series = buildSeries(code);

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

function collapseExpand(card) {
    if (!card) return;
    card.classList.remove("expandido");
    card.style.width = "";
    card.style.height = "";
    card.style.transform = "";
    const overlay = document.getElementById("expandOverlay");
    if (overlay) overlay.style.display = "none";
    document.removeEventListener("keydown", onExpandEscape);
    document.body.style.overflow = "";
    renderDashboard(currentIndicator);
}

function onExpandEscape(e) {
    if (e.key === "Escape") {
        collapseExpand(document.querySelector(".chart-card.expandido"));
    }
}

function toggleExpand(targetId) {
    const toolbar = document.querySelector(`.visual-toolbar[data-target="${targetId}"]`);
    if (!toolbar) return;
    const card = toolbar.closest(".chart-card");

    if (card.classList.contains("expandido")) {
        collapseExpand(card);
        return;
    }

    const other = document.querySelector(".chart-card.expandido");
    if (other) collapseExpand(other);

    const gap = 48;
    const rect = card.getBoundingClientRect();
    const scaleMap = { mainChart: 1, varsChart: 1.5, indicesChart: 1.5 };
    const scale = scaleMap[targetId] ?? 1.5;
    card.style.width = Math.min(rect.width * scale, window.innerWidth - gap) + "px";
    card.style.height = Math.min(rect.height * scale, window.innerHeight - gap) + "px";
    card.style.transform = "translate(-50%, -50%)";
    card.classList.add("expandido");
    void card.offsetHeight;
    document.body.style.overflow = "hidden";

    let overlay = document.getElementById("expandOverlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "expandOverlay";
        overlay.style.cssText = "position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.4)";
        overlay.addEventListener("click", () => {
            collapseExpand(document.querySelector(".chart-card.expandido"));
        });
        document.body.appendChild(overlay);
    }
    overlay.style.display = "block";
    document.addEventListener("keydown", onExpandEscape);

    renderDashboard(currentIndicator);
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
    if (targetId === "mainChart" || targetId === "indicesChart") renderDashboard(currentIndicator);
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
}
