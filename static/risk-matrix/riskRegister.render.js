function renderRiskRegister() {
  const container = document.getElementById("riskRegisterBody");
  if (!container) return;

  const risks = typeof computeAllRisks === "function" ? computeAllRisks() : [];
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
      <div class="risk-matrix-subtitle">Listagem consolidada de eventos, causas de risco, status de mitigação e classificação quantitativa da CAESB</div>
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

  // Cabeçalho da Tabela
  table.innerHTML = `
    <thead>
      <tr>
        <th style="width: 60px;">ID</th>
        <th>Categoria (Evento)</th>
        <th>Causa de Risco</th>
        <th style="text-align: center; width: 80px;">Prob.</th>
        <th style="text-align: center; width: 80px;">Imp.</th>
        <th style="text-align: center; width: 80px;">Score</th>
        <th>Classificação</th>
        <th>Status Tratamento</th>
        <th>Dono (Área)</th>
        <th style="width: 100px;">Prazo</th>
        <th style="text-align: center; width: 80px;">Ações</th>
      </tr>
    </thead>
    <tbody id="riskRegisterTableBody"></tbody>
  `;

  tableCard.appendChild(table);
  container.appendChild(tableCard);

  const tbody = table.querySelector("#riskRegisterTableBody");

  // Cores de score do design system para aplicação inline segura
  const scoreColors = {
    verde: "#1f9e6d",
    amarelo: "#a6790a",
    laranja: "#c9751a",
    vermelho: "#d64550",
    neutro: "#999"
  };

  risks.forEach((risk, index) => {
    const rId = "R" + String(index + 1).padStart(2, "0");
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";

    // Valores calculados do motor de riscos
    const probVal = risk.probabilidade && risk.probabilidade.nivel !== null ? risk.probabilidade.nivel : "N/D";
    const impVal = risk.impacto;
    const scoreVal = risk.score !== null ? risk.score : "—";

    const scoreCls = risk.classificacao ? risk.classificacao.cor : "neutro";
    const scoreColor = scoreColors[scoreCls] || "#999";

    const status = risk.statusTratamento || "Pendente";
    const statusClass = "status-badge-" + status.toLowerCase().replace(/\s+/g, "-");
    const dono = risk.dono || "—";
    const prazo = risk.prazo || "—";

    const classRotulo = risk.classificacao ? risk.classificacao.rotulo : "Sem dado";
    const badgeHtml = `<span class="reval-class-dot lvl-${scoreCls}"></span>${classRotulo}`;
    const statusHtml = `<span class="status-badge ${statusClass}">${status}</span>`;

    tr.innerHTML = `
      <td style="font-weight: 600; color: var(--text-secondary);">${rId}</td>
      <td>${risk.eventoNome}</td>
      <td style="font-weight: 600; color: var(--text-primary);">${risk.nome}</td>
      <td style="text-align: center; font-weight: 600;">${probVal}</td>
      <td style="text-align: center; font-weight: 600;">${impVal}</td>
      <td style="text-align: center; font-weight: 700; color: ${scoreColor};">${scoreVal}</td>
      <td>${badgeHtml}</td>
      <td>${statusHtml}</td>
      <td><b>${dono}</b></td>
      <td>${prazo}</td>
      <td style="text-align: center;">
        <button class="view-detail-btn" style="background: none; border: none; cursor: pointer; color: var(--accent); display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 4px;" title="Ver Detalhes">
          <span class="material-symbols-outlined" style="font-size: 18px;">visibility</span>
        </button>
      </td>
    `;

    // Adiciona evento de clique para abrir o modal de detalhes
    tr.addEventListener("click", () => {
      if (typeof _openDetail === "function") {
        _openDetail(risk);
      }
    });

    // Botão de ação (impede borbulhamento de evento para evitar duplicação)
    const btn = tr.querySelector(".view-detail-btn");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof _openDetail === "function") {
        _openDetail(risk);
      }
    });

    tbody.appendChild(tr);
  });
}
