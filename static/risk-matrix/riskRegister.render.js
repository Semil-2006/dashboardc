function renderRiskRegister() {
  const container = document.getElementById("riskRegisterBody");
  if (!container) return;

  const cfg = typeof getRiskConfig === "function" ? getRiskConfig() : (typeof window !== "undefined" && window._riskConfig ? window._riskConfig : null);
  const risks = cfg && cfg.quadroRiscos ? cfg.quadroRiscos : [];

  if (!risks.length) {
    container.innerHTML = "<div style='padding:40px;text-align:center;color:var(--text-secondary)'>Carregando dados do Quadro de Riscos...</div>";
    return;
  }

  container.innerHTML = "";

  // Área de Título (estilo Power BI / Matriz)
  const titleArea = document.createElement("div");
  titleArea.className = "risk-matrix-title-area";
  titleArea.innerHTML = `
    <div>
      <div class="risk-matrix-title">Quadro de Registro de Riscos</div>
      <div class="risk-matrix-subtitle">Listagem consolidada de eventos, impactos, mitigações e classificação quantitativa do PROINT da CAESB</div>
    </div>
  `;
  container.appendChild(titleArea);

  // Wrapper do cartão de tabela para rolagem responsiva
  const tableCard = document.createElement("div");
  tableCard.className = "table-card";
  tableCard.style.marginTop = "20px";
  tableCard.style.width = "100%";
  tableCard.style.overflowX = "auto";

  const table = document.createElement("table");
  table.className = "data-table";

  // Cabeçalho da Tabela (exatamente os 6 headers do usuário)
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

  tableCard.appendChild(table);
  container.appendChild(tableCard);

  const tbody = table.querySelector("#riskRegisterTableBody");

  function formatNivel(nivel) {
    let corCls = "neutro";
    if (nivel === "Alto") corCls = "vermelho";
    else if (nivel === "Médio") corCls = "amarelo";
    else if (nivel === "Baixo") corCls = "verde";

    return `
      <div style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; justify-content: center; width: 100%;">
        <span class="reval-class-dot lvl-${corCls}"></span>
        ${nivel}
      </div>
    `;
  }

  function formatMitigacao(mitigacoes) {
    if (!mitigacoes || !mitigacoes.length) return "—";
    return `
      <ul style="margin: 0; padding-left: 16px; list-style-type: disc; text-align: left;">
        ${mitigacoes.map(m => `<li style="margin-bottom: 4px; line-height: 1.4; color: var(--text-primary);">${m}</li>`).join("")}
      </ul>
    `;
  }

  risks.forEach((risk) => {
    const tr = document.createElement("tr");

    const codVal = risk.cod || "—";
    const eventoVal = risk.evento || "—";
    const impactoHtml = (risk.impacto || "—").replace(/\n/g, "<br>");
    const inerenteHtml = formatNivel(risk.nivelInerente);
    const mitigacaoHtml = formatMitigacao(risk.mitigacao);
    const residualHtml = formatNivel(risk.nivelResidual);

    tr.innerHTML = `
      <td style="font-weight: 600; color: var(--text-secondary); text-align: center; vertical-align: top;">${codVal}</td>
      <td style="font-weight: 600; color: var(--text-primary); vertical-align: top;">${eventoVal}</td>
      <td style="color: var(--text-primary); vertical-align: top; line-height: 1.4;">${impactoHtml}</td>
      <td style="text-align: center; vertical-align: top;">${inerenteHtml}</td>
      <td style="vertical-align: top;">${mitigacaoHtml}</td>
      <td style="text-align: center; vertical-align: top;">${residualHtml}</td>
    `;

    tbody.appendChild(tr);
  });
}
