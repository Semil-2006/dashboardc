let _registerFilters = { inerente: "Todos", residual: "Todos" };

function renderRiskRegister() {
  const container = document.getElementById("riskRegisterBody");
  if (!container) return;

  const cfg = typeof getRiskConfig === "function" ? getRiskConfig() : (typeof window !== "undefined" && window._riskConfig ? window._riskConfig : null);
  const risks = cfg && cfg.quadroRiscos ? cfg.quadroRiscos : [];

  if (!risks.length) {
    container.innerHTML = "<div style='padding:40px;text-align:center;color:var(--text-secondary)'>Carregando dados da Matriz de Riscos...</div>";
    return;
  }

  container.innerHTML = "";

  const titleArea = document.createElement("div");
  titleArea.className = "risk-matrix-title-area";
  titleArea.innerHTML = `
    <div>
      <div class="risk-matrix-title">Matriz de Registro de Riscos</div>
      <div class="risk-matrix-subtitle">Listagem consolidada de eventos, impactos, mitigações e classificação quantitativa do PROINT da CAESB</div>
    </div>
  `;
  container.appendChild(titleArea);

  const filterBar = document.createElement("div");
  filterBar.className = "rr-filter-bar";
  filterBar.innerHTML = `
    <label class="rr-filter-label">Nível de Risco Inerente</label>
    <select class="rr-filter-select" id="rrFilterInerente">
      <option value="Todos">Todos</option>
      <option value="Alto">Alto</option>
      <option value="Médio">Médio</option>
      <option value="Baixo">Baixo</option>
    </select>
    <label class="rr-filter-label">Nível de Risco Residual</label>
    <select class="rr-filter-select" id="rrFilterResidual">
      <option value="Todos">Todos</option>
      <option value="Alto">Alto</option>
      <option value="Médio">Médio</option>
      <option value="Baixo">Baixo</option>
    </select>
  `;
  container.appendChild(filterBar);

  const inerenteSelect = filterBar.querySelector("#rrFilterInerente");
  const residualSelect = filterBar.querySelector("#rrFilterResidual");
  inerenteSelect.value = _registerFilters.inerente;
  residualSelect.value = _registerFilters.residual;

  const onFilterChange = function () {
    _registerFilters.inerente = inerenteSelect.value;
    _registerFilters.residual = residualSelect.value;
    _renderRegisterRows(tbody, risks);
  };
  inerenteSelect.addEventListener("change", onFilterChange);
  residualSelect.addEventListener("change", onFilterChange);

  const tableCard = document.createElement("div");
  tableCard.className = "chart-card";
  tableCard.style.marginTop = "16px";
  tableCard.style.width = "100%";
  tableCard.style.position = "relative";

  const cardHeader = document.createElement("div");
  cardHeader.className = "chart-card-header";
  cardHeader.style.justifyContent = "space-between";
  cardHeader.innerHTML = '<div class="chart-card-title">Matriz de Riscos</div><div class="visual-toolbar" data-target="riskRegister"></div>';
  tableCard.appendChild(cardHeader);

  const tableScroll = document.createElement("div");
  tableScroll.style.overflowX = "auto";

  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th style="width: 80px; text-align: center;">Cód.</th>
        <th style="width: 200px;">Evento de Risco<br>de Integridade<br>(PROINT)</th>
        <th style="width: 250px;">Impacto Principal<br>na Caesb</th>
        <th style="width: 140px; text-align: center;">Nível de<br>Risco<br>Inerente</th>
        <th>Instrumentos de Mitigação e<br>Controles Internos Atuais</th>
        <th style="width: 140px; text-align: center;">Nível de<br>Risco<br>Residual</th>
      </tr>
    </thead>
    <tbody id="riskRegisterTableBody"></tbody>
  `;
  tableScroll.appendChild(table);
  tableCard.appendChild(tableScroll);
  container.appendChild(tableCard);

  const tbody = table.querySelector("#riskRegisterTableBody");
  _renderRegisterRows(tbody, risks);

  _initRegisterToolbar();
}

function _renderRegisterRows(tbody, risks) {
  tbody.innerHTML = "";

  const filtered = risks.filter(function (r) {
    if (_registerFilters.inerente !== "Todos" && r.nivelInerente !== _registerFilters.inerente) return false;
    if (_registerFilters.residual !== "Todos" && r.nivelResidual !== _registerFilters.residual) return false;
    return true;
  });

  if (!filtered.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="6" style="text-align:center;padding:24px;color:var(--text-secondary);font-style:italic;">Nenhum risco encontrado com os filtros selecionados.</td>';
    tbody.appendChild(tr);
    return;
  }

  function formatNivel(nivel) {
    let corCls = "neutro";
    if (nivel === "Alto") corCls = "vermelho";
    else if (nivel === "Médio") corCls = "amarelo";
    else if (nivel === "Baixo") corCls = "verde";
    return '<div style="display:inline-flex;align-items:center;gap:8px;font-weight:600;justify-content:center;width:100%;"><span class="reval-class-dot lvl-' + corCls + '"></span>' + nivel + '</div>';
  }

  function formatMitigacao(mitigacoes) {
    if (!mitigacoes || !mitigacoes.length) return "\u2014";
    return '<ul style="margin:0;padding-left:16px;list-style-type:disc;text-align:left;">' + mitigacoes.map(function (m) { return '<li style="margin-bottom:4px;line-height:1.4;color:var(--text-primary);">' + m + '</li>'; }).join("") + '</ul>';
  }

  filtered.forEach(function (risk, i) {
    const tr = document.createElement("tr");
    tr.style.animation = "tableRowEnter .3s both";
    tr.style.animationDelay = (i * 30) + "ms";
    const codVal = risk.cod || "\u2014";
    const eventoVal = risk.evento || "\u2014";
    const impactoHtml = (risk.impacto || "\u2014").replace(/\n/g, "<br>");
    tr.innerHTML =
      '<td style="font-weight:600;color:var(--text-secondary);text-align:center;vertical-align:top;">' + codVal + '</td>' +
      '<td style="font-weight:600;color:var(--text-primary);vertical-align:top;">' + eventoVal + '</td>' +
      '<td style="color:var(--text-primary);vertical-align:top;line-height:1.4;">' + impactoHtml + '</td>' +
      '<td style="text-align:center;vertical-align:top;">' + formatNivel(risk.nivelInerente) + '</td>' +
      '<td style="vertical-align:top;">' + formatMitigacao(risk.mitigacao) + '</td>' +
      '<td style="text-align:center;vertical-align:top;">' + formatNivel(risk.nivelResidual) + '</td>';
    tbody.appendChild(tr);
  });
}

function _initRegisterToolbar() {
  const toolbar = document.querySelector('.visual-toolbar[data-target="riskRegister"]');
  if (!toolbar) return;

  const ICONS = (typeof window !== "undefined" && window.ICONS) ? window.ICONS : {
    filter: '<svg viewBox="0 0 24 24"><path d="M3 4h18l-7 8v5l-4 2V12z"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>'
  };

  toolbar.innerHTML =
    '<button class="toolbar-btn" data-btn="filter" title="Filtro">' + ICONS.filter + '</button>' +
    '<button class="toolbar-btn" data-btn="more" title="Mais opções">' + ICONS.more + '</button>';

  const menu = document.createElement("div");
  menu.className = "visual-menu";
  menu.innerHTML =
    '<div class="visual-menu-item" data-action="export-rr"><svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.6"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg><span>Exportar dados</span></div>' +
    '<div class="visual-menu-item" data-action="clear-filters-rr"><svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.6"><path d="M18 6L6 18M6 6l12 12"/></svg><span>Limpar filtros</span></div>';
  toolbar.closest(".chart-card").appendChild(menu);

  toolbar.querySelector('[data-btn="more"]').addEventListener("click", function (e) {
    e.stopPropagation();
    const isOpen = menu.classList.contains("open");
    if (typeof closeAllVisualMenus === "function") closeAllVisualMenus();
    if (!isOpen) menu.classList.add("open");
  });

  toolbar.querySelector('[data-btn="filter"]').addEventListener("click", function (e) {
    e.stopPropagation();
    const filterBar = document.querySelector(".rr-filter-bar");
    if (filterBar) {
      filterBar.style.display = filterBar.style.display === "none" ? "flex" : "none";
    }
  });

  menu.addEventListener("click", function (e) {
    const item = e.target.closest(".visual-menu-item");
    if (!item) return;
    const action = item.dataset.action;
    if (action === "export-rr") _exportRegisterCSV();
    if (action === "clear-filters-rr") {
      _registerFilters = { inerente: "Todos", residual: "Todos" };
      renderRiskRegister();
    }
    if (typeof closeAllVisualMenus === "function") closeAllVisualMenus();
  });
}

function _exportRegisterCSV() {
  const cfg = typeof getRiskConfig === "function" ? getRiskConfig() : (typeof window !== "undefined" && window._riskConfig ? window._riskConfig : null);
  const risks = cfg && cfg.quadroRiscos ? cfg.quadroRiscos : [];
  if (!risks.length) return;

  let csv = "Código,Evento,Impacto,Risco Inerente,Mitigação,Risco Residual\n";
  risks.forEach(function (r) {
    const mit = (r.mitigacao || []).join("; ").replace(/"/g, '""');
    csv += '"' + (r.cod || "") + '","' + (r.evento || "") + '","' + (r.impacto || "").replace(/\n/g, " ") + '","' + (r.nivelInerente || "") + '","' + mit + '","' + (r.nivelResidual || "") + '"\n';
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quadro_riscos.csv";
  a.click();
  URL.revokeObjectURL(url);
}
