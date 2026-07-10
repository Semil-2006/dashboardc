let _detailOpen = false;
let _lastActiveElement = null;

function renderRiskMatrix() {
  const container = document.getElementById("riskMatrixBody");
  if (!container) return;

  const cfg = typeof getRiskConfig === "function" ? getRiskConfig() : (typeof window !== "undefined" && window._riskConfig ? window._riskConfig : null);
  let risks = cfg && cfg.quadroRiscos ? cfg.quadroRiscos : [];
  if (!risks.length && typeof computeAllRisks === "function") {
    risks = computeAllRisks();
  }

  if (!risks.length) {
    container.innerHTML = "<div style='padding:40px;text-align:center;color:var(--text-secondary)'>Carregando dados da Matriz de Calor...</div>";
    return;
  }
  container.innerHTML = "";
  const layout = document.createElement("div");
  layout.className = "risk-matrix-layout";
  layout.appendChild(_buildTitleArea());
  layout.appendChild(_buildGrid(risks));
  layout.appendChild(_buildSupportPanel());
  layout.appendChild(_buildLegend());
  layout.appendChild(_buildCollapsedList(risks));
  container.appendChild(layout);
  _renderResponsive();
  window.addEventListener("resize", _renderResponsive);
}

function _buildTitleArea() {
  const area = document.createElement("div");
  area.className = "risk-matrix-title-area";
  area.innerHTML = '<div><div class="risk-matrix-title">Matriz de Calor</div><div class="risk-matrix-subtitle">Probabilidade \u00d7 Impacto — Classifica\u00e7\u00e3o de riscos residuais por score (1–9)</div></div>';
  return area;
}

function _buildGrid(risks) {
  const wrapper = document.createElement("div");
  wrapper.className = "risk-grid-container";
  const impactLabels = ["Baixo", "M\u00e9dio", "Alto"];
  const probLabels = ["Baixa", "M\u00e9dia", "Alta"];
  const header = document.createElement("div");
  header.className = "risk-grid-header";
  header.innerHTML = '<div class="risk-header-label risk-header-corner"><span class="rh-impact">\u2193 Impacto</span><span class="rh-prob">\u2192 Prob.</span></div>' + impactLabels.map((l, i) => '<div class="risk-header-label"><span class="rh-col-num">' + (i + 1) + '</span> ' + l + "</div>").join("");
  wrapper.appendChild(header);
  const body = document.createElement("div");
  body.className = "risk-grid-body";

  for (let prob = 3; prob >= 1; prob--) {
    const row = document.createElement("div");
    row.className = "risk-grid-row";
    const label = document.createElement("div");
    label.className = "risk-grid-row-label";
    label.innerHTML = '<span class="prob-num">' + prob + '</span><span class="prob-text">' + probLabels[prob - 1] + '</span>';
    row.appendChild(label);

    for (let imp = 1; imp <= 3; imp++) {
      const score = prob * imp;
      const cls = classifyScore(score);
      const cell = document.createElement("div");
      cell.className = "risk-cell risk-" + cls.cor;
      cell.innerHTML = '<span class="cell-score">' + score + "</span>";

      const cellRisks = risks.filter(r => {
        if (r.cod) {
          return r.probabilidadeResidual === prob && r.impactoNum === imp;
        } else {
          return r.indicador && r.probabilidade && r.probabilidade.nivel === prob && r.impacto === imp;
        }
      });

      cellRisks.forEach(r => {
        cell.appendChild(_buildBadge(r));
      });
      row.appendChild(cell);
    }
    body.appendChild(row);
  }
  wrapper.appendChild(body);

  const noDataRisks = risks.filter(r => {
    if (r.cod) {
      return r.probabilidadeResidual === null || r.probabilidadeResidual === undefined;
    } else {
      return !r.indicador;
    }
  });

  if (noDataRisks.length) {
    const ndRow = document.createElement("div");
    ndRow.className = "risk-no-data-row";
    const ndLabel = document.createElement("div");
    ndLabel.className = "risk-no-data-label";
    ndLabel.innerHTML = "Prob.<br>N/D";
    ndRow.appendChild(ndLabel);

    for (let imp = 1; imp <= 3; imp++) {
      const cell = document.createElement("div");
      cell.className = "risk-cell risk-neutro";
      cell.innerHTML = '<span class="cell-score">\u2014</span>';

      const cellRisks = noDataRisks.filter(r => {
        if (r.cod) {
          return r.impactoNum === imp;
        } else {
          return r.impacto === imp;
        }
      });

      cellRisks.forEach(r => {
        cell.appendChild(_buildBadge(r));
      });
      ndRow.appendChild(cell);
    }
    body.appendChild(ndRow);
  }
  return wrapper;
}

function _buildBadge(risk) {
  const badge = document.createElement("div");
  const isNew = !!risk.cod;
  const hasInd = isNew ? true : !!risk.indicador;
  badge.className = "risk-badge " + (hasInd ? "has-indicator" : "no-indicator");
  badge.dataset.riskId = isNew ? risk.cod : risk.id;
  badge.title = isNew ? risk.evento : risk.nome;

  if (isNew) {
    badge.textContent = risk.cod;
  } else {
    if (risk.probabilidade && risk.score !== null) {
      badge.textContent = risk.nome;
    } else {
      badge.innerHTML = '<span class="badge-count">!</span>' + risk.nome;
    }
  }

  const tooltipHtml = _buildTooltipHtml(risk);
  badge.addEventListener("mouseenter", function (e) {
    if (typeof showTooltip === "function") showTooltip(e, tooltipHtml);
  });
  badge.addEventListener("mousemove", function (e) {
    if (typeof positionTooltip === "function") positionTooltip(e);
  });
  badge.addEventListener("mouseleave", function () {
    if (typeof hideTooltip === "function") hideTooltip();
  });
  badge.addEventListener("click", function () {
    _openDetail(risk);
  });
  return badge;
}

function _buildTooltipHtml(risk) {
  const isNew = !!risk.cod;
  if (isNew) {
    let corResidual = "neutro";
    if (risk.nivelResidual === "Alto") corResidual = "vermelho";
    else if (risk.nivelResidual === "Médio") corResidual = "amarelo";
    else if (risk.nivelResidual === "Baixo") corResidual = "verde";
    const scoreResidual = risk.probabilidadeResidual * risk.impactoNum;

    return '<div class="tt-title">' + risk.cod + ' &mdash; ' + risk.evento + '</div><div class="tt-row">Risco Inerente: <b>' + risk.nivelInerente + '</b></div><div class="tt-row">Risco Residual: <b style="color:' + (corResidual === "vermelho" ? "var(--negative)" : corResidual === "amarelo" ? "#a6790a" : "var(--positive)") + ';">' + risk.nivelResidual + ' (' + scoreResidual + ')</b></div><div class="tt-row" style="border-top:1px solid var(--border-subtle);padding-top:4px;margin-top:4px;max-width:260px;white-space:normal;font-size:10px;color:var(--text-secondary)">Clique para ver a mitigação e os detalhes completos.</div>';
  } else {
    var trendIcon = risk.trend || "";
    if (risk.indicador) {
      return '<div class="tt-title">' + risk.nome + ' <span style="color:' + (risk.classificacao.cor === "vermelho" ? "var(--negative)" : risk.classificacao.cor === "amarelo" ? "#a6790a" : "var(--positive)") + '">' + trendIcon + '</span></div><div class="tt-row">Evento: ' + risk.eventoNome + "</div><div class='tt-row'>Indicador: <b>" + risk.indicador + "</b></div><div class='tt-row'>Probabilidade: <b>" + risk.probabilidade.rotulo + " (" + risk.probabilidade.nivel + "/3)</b></div><div class='tt-row'>Impacto: <b>" + risk.impacto + "/3</b></div><div class='tt-row'>Score: <b>" + risk.score + "</b> \u2014 <b>" + risk.classificacao.rotulo + "</b></div><div class='tt-row' style='border-top:1px solid var(--border-subtle);padding-top:4px;margin-top:4px;max-width:260px;white-space:normal'>" + risk.probabilidade.detalhe + "</div>";
    }
    var justificativa = risk.justificativa || "Justificativa de impacto não preenchida.";
    return '<div class="tt-title">' + risk.nome + ' <span style="color:#999">!</span></div><div class="tt-row">Evento: ' + risk.eventoNome + "</div><div class='tt-row'>Impacto: <b>" + risk.impacto + "/3</b></div><div class='tt-row' style='color:var(--negative)'><b>Sem indicador implantado</b></div><div class='tt-row' style='border-top:1px solid var(--border-subtle);padding-top:4px;margin-top:4px;max-width:260px;white-space:normal'>" + justificativa + "</div>";
  }
}

function _openDetail(risk) {
  if (_detailOpen) _closeDetail();
  _detailOpen = true;
  _lastActiveElement = document.activeElement;

  const overlay = document.createElement("div");
  overlay.id = "riskDetailOverlay";
  overlay.style.cssText = "position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);";
  overlay.addEventListener("click", _closeDetail);
  document.body.appendChild(overlay);
  document.body.classList.add("body-scroll-lock");

  const panel = document.createElement("div");
  panel.className = "risk-detail-panel open";
  panel.id = "riskDetailPanel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "riskModalTitle");

  const isNew = !!risk.cod;
  const cod = risk.cod || "RI";
  const nome = isNew ? risk.evento : risk.nome;

  let corResidual = "neutro";
  let nivelResidual = "";
  let scoreResidual = "";
  if (isNew) {
    nivelResidual = risk.nivelResidual;
    if (nivelResidual === "Alto") corResidual = "vermelho";
    else if (nivelResidual === "Médio") corResidual = "amarelo";
    else if (nivelResidual === "Baixo") corResidual = "verde";
    scoreResidual = risk.probabilidadeResidual * risk.impactoNum;
  } else {
    nivelResidual = risk.classificacao ? risk.classificacao.rotulo : "Sem dado";
    corResidual = risk.classificacao ? risk.classificacao.cor : "neutro";
    scoreResidual = risk.score !== null ? risk.score : "—";
  }

  let corInerente = "neutro";
  let nivelInerente = "";
  let scoreInerente = "";
  if (isNew) {
    nivelInerente = risk.nivelInerente;
    if (nivelInerente === "Alto") corInerente = "vermelho";
    else if (nivelInerente === "Médio") corInerente = "amarelo";
    else if (nivelInerente === "Baixo") corInerente = "verde";
    scoreInerente = risk.probabilidadeInerente * risk.impactoNum;
  }

  const status = risk.statusTratamento || "Pendente";
  const dono = risk.dono || "Área não designada";
  const prazo = risk.prazo || "Prazo não definido";
  const plano = risk.planoAcao || "Nenhum plano de ação registrado.";
  const reavaliacoes = risk.reavaliacoes || [];
  const justificativa = risk.justificativa || "Justificativa de impacto não preenchida.";

  let innerHtml = '<button class="close-btn" aria-label="Fechar diálogo" onclick="_closeDetail()">&times;</button>';
  innerHtml += '<div class="risk-detail-header">';
  innerHtml += '  <h2 class="risk-detail-title" id="riskModalTitle" tabindex="-1" style="outline:none;">' + cod + ' &mdash; ' + nome + '</h2>';
  innerHtml += '</div>';

  innerHtml += '<div class="risk-detail-body">';

  if (isNew) {
    const mitigacoesHtml = (risk.mitigacao || []).map(m => `
      <li style="margin-bottom: 8px; line-height: 1.4; color: var(--text-primary); font-size: 12px;">${m}</li>
    `).join("");

    const impactoHtml = (risk.impacto || "—").replace(/\n/g, "<br>");

    innerHtml += '  <div class="risk-detail-grid">';
    innerHtml += '    <div class="risk-detail-col">';
    innerHtml += '      <div class="rd-section-title">Avaliação de Risco</div>';

    innerHtml += '      <div class="risk-detail-row">';
    innerHtml += '        <span class="rd-label">Risco Inerente</span>';
    innerHtml += '        <span class="rd-value">';
    innerHtml += '          <span class="risk-badge-chip chip-' + corInerente + '">' + nivelInerente + ' (Score: ' + scoreInerente + ')</span>';
    innerHtml += '        </span>';
    innerHtml += '      </div>';

    innerHtml += '      <div class="risk-detail-row">';
    innerHtml += '        <span class="rd-label">Risco Residual</span>';
    innerHtml += '        <span class="rd-value">';
    innerHtml += '          <span class="risk-badge-chip chip-' + corResidual + '">' + nivelResidual + ' (Score: ' + scoreResidual + ')</span>';
    innerHtml += '        </span>';
    innerHtml += '      </div>';

    innerHtml += '      <div class="risk-detail-row" style="flex-direction:column;align-items:flex-start;margin-top:16px;">';
    innerHtml += '        <span class="rd-label" style="margin-bottom:6px;">Impacto Principal na Caesb</span>';
    innerHtml += '        <span class="rd-value" style="white-space:normal;font-size:12px;line-height:1.5;color:var(--text-primary);">' + impactoHtml + '</span>';
    innerHtml += '      </div>';
    innerHtml += '    </div>';

    innerHtml += '    <div class="risk-detail-col">';
    innerHtml += '      <div class="rd-section-title">Mitigação e Controles Internos</div>';
    innerHtml += '      <div class="risk-detail-row" style="flex-direction:column;align-items:flex-start;width:100%;">';
    innerHtml += '        <ul style="margin: 0; padding-left: 18px; list-style-type: disc; width: 100%;">';
    innerHtml +=           mitigacoesHtml;
    innerHtml += '        </ul>';
    innerHtml += '      </div>';
    innerHtml += '    </div>';
    innerHtml += '  </div>';
  } else {
    // Mantém o layout antigo para suportar os testes antigos do Jest intactos!
    if (risk.indicador) {
      innerHtml += '<div class="risk-detail-grid">';
      innerHtml += '  <div class="risk-detail-col">';
      innerHtml += '    <div class="rd-section-title">1. Análise Quantitativa</div>';

      innerHtml += '    <div class="risk-detail-row">';
      innerHtml += '      <span class="rd-label">Indicador vinculado</span>';
      innerHtml += '      <span class="rd-value">';
      innerHtml += '        <span class="risk-detail-indicator-link" tabindex="0" data-code="' + risk.indicador + '">' + risk.indicador + '</span>';
      innerHtml += '      </span>';
      innerHtml += '    </div>';

      innerHtml += '    <div class="risk-detail-row">';
      innerHtml += '      <span class="rd-label">Impacto (Fixo)</span>';
      innerHtml += '      <span class="rd-value">' + risk.impacto + '/3 <span class="rd-sub-label">(' + justificativa + ')</span></span>';
      innerHtml += '    </div>';

      var probVal = risk.probabilidade && risk.probabilidade.nivel !== null ? risk.probabilidade.rotulo + ' (' + risk.probabilidade.nivel + '/3)' : 'Não calculável';
      innerHtml += '    <div class="risk-detail-row">';
      innerHtml += '      <span class="rd-label">Probabilidade</span>';
      innerHtml += '      <span class="rd-value">' + probVal + '</span>';
      innerHtml += '    </div>';

      innerHtml += '    <div class="risk-detail-row">';
      innerHtml += '      <span class="rd-label">Score de Risco</span>';
      innerHtml += '      <span class="rd-value"><span class="risk-badge-chip chip-' + corResidual + '">' + scoreResidual + ' &mdash; ' + nivelResidual + '</span></span>';
      innerHtml += '    </div>';
      innerHtml += '  </div>';

      innerHtml += '  <div class="risk-detail-col">';
      innerHtml += '    <div class="rd-section-title">2. Quadro de Riscos (Gestão PRGA)</div>';
      var statusClass = "status-badge-" + status.toLowerCase().replace(/\s+/g, "-");
      innerHtml += '    <div class="risk-detail-row">';
      innerHtml += '      <span class="rd-label">Status de Tratamento</span>';
      innerHtml += '      <span class="rd-value"><span class="status-badge ' + statusClass + '">' + status + '</span></span>';
      innerHtml += '    </div>';
      innerHtml += '    <div class="risk-detail-row">';
      innerHtml += '      <span class="rd-label">Área Proprietária (Dono)</span>';
      innerHtml += '      <span class="rd-value"><b>' + dono + '</b></span>';
      innerHtml += '    </div>';
      innerHtml += '    <div class="risk-detail-row">';
      innerHtml += '      <span class="rd-label">Prazo de Conclusão</span>';
      innerHtml += '      <span class="rd-value">' + prazo + '</span>';
      innerHtml += '    </div>';
      innerHtml += '    <div class="risk-detail-row" style="flex-direction:column;align-items:flex-start;">';
      innerHtml += '      <span class="rd-label" style="margin-bottom:4px;">Ações e Plano de Mitigação</span>';
      innerHtml += '      <span class="rd-value" style="white-space:normal;font-size:11px;line-height:1.4;">' + plano + '</span>';
      innerHtml += '    </div>';
      innerHtml += '  </div>';
      innerHtml += '</div>';

      // Seção Histórico de Reavaliações
      innerHtml += '<div class="risk-reval-section">';
      innerHtml += '  <div class="rd-section-title">3. Histórico de Reavaliações</div>';
      if (reavaliacoes.length > 0) {
        var sortedReval = [...reavaliacoes].sort(function(a, b) {
          return new Date(b.data) - new Date(a.data);
        });
        innerHtml += '  <div class="risk-reval-table-container">';
        innerHtml += '    <table class="risk-reval-table">';
        innerHtml += '      <thead>';
        innerHtml += '        <tr>';
        innerHtml += '          <th>Data da Avaliação</th>';
        innerHtml += '          <th style="text-align:center;">Score Obtido</th>';
        innerHtml += '          <th>Classificação de Risco</th>';
        innerHtml += '        </tr>';
        innerHtml += '      </thead>';
        innerHtml += '      <tbody>';
        sortedReval.forEach(function(item) {
          var cls = typeof classifyScore === "function" ? classifyScore(item.score) : { cor: "neutro", rotulo: "Sem dado" };
          innerHtml += '        <tr>';
          innerHtml += '          <td>' + item.data + '</td>';
          innerHtml += '          <td style="text-align:center;font-weight:600;">' + item.score + '</td>';
          innerHtml += '          <td><span class="reval-class-dot lvl-' + cls.cor + '"></span>' + cls.rotulo + '</td>';
          innerHtml += '        </tr>';
        });
        innerHtml += '      </tbody>';
        innerHtml += '    </table>';
        innerHtml += '  </div>';
      } else {
        innerHtml += '  <div class="risk-detail-observacao" style="margin-top:8px;">Nenhuma reavaliação anterior registrada para este risco.</div>';
      }
      innerHtml += '</div>';
    } else {
      // Risco de escanteio / Sem indicador (integrado com melhorias do remote)
      innerHtml += '<div class="risk-detail-escanteio">';
      innerHtml += '  <div class="risk-detail-row">';
      innerHtml += '    <span class="rd-label">Indicador vinculado</span>';
      innerHtml += '    <span class="rd-value" style="color:var(--negative);font-weight:600;">Não implantado</span>';
      innerHtml += '  </div>';
      innerHtml += '  <div class="risk-detail-row">';
      innerHtml += '    <span class="rd-label">Impacto atribuído (Fixo)</span>';
      innerHtml += '    <span class="rd-value">' + risk.impacto + '/3 <span class="rd-sub-label">(' + justificativa + ')</span></span>';
      innerHtml += '  </div>';
      innerHtml += '  <div class="risk-detail-row">';
      innerHtml += '    <span class="rd-label">Status de Tratamento</span>';
      innerHtml += '    <span class="rd-value"><span class="status-badge status-badge-' + status.toLowerCase().replace(/\s+/g, '-') + '">' + status + '</span></span>';
      innerHtml += '  </div>';
      if (risk.dono) {
        innerHtml += '  <div class="risk-detail-row">';
        innerHtml += '    <span class="rd-label">Área Proprietária (Dono)</span>';
        innerHtml += '    <span class="rd-value"><b>' + risk.dono + '</b></span>';
        innerHtml += '  </div>';
      }
      if (risk.prazo) {
        innerHtml += '  <div class="risk-detail-row">';
        innerHtml += '    <span class="rd-label">Prazo de Conclusão</span>';
        innerHtml += '    <span class="rd-value">' + risk.prazo + '</span>';
        innerHtml += '  </div>';
      }
      innerHtml += '  <div class="risk-detail-observacao" style="margin-top:16px;">';
      innerHtml += '    <b>Risco sem Indicador Quantitativo:</b> Este evento de risco não possui métricas ativas ou indicador de conformidade implementado. A classificação de probabilidade é baseada em avaliação qualitativa. A PRGA planeja a estruturação e futura integração deste indicador nas próximas fases do plano de integridade.';
      innerHtml += '  </div>';
      innerHtml += '</div>';
    }
  }

  innerHtml += '</div>';

  panel.innerHTML = innerHtml;
  document.body.appendChild(panel);

  const titleEl = document.getElementById("riskModalTitle");
  if (titleEl) titleEl.focus();

  _setupFocusTrap(panel);
  document.addEventListener("keydown", _onDetailEscape);

  var link = panel.querySelector(".risk-detail-indicator-link");
  if (link) {
    link.addEventListener("click", function () {
      var code = this.dataset.code;
      _closeDetail();
      if (typeof switchToIndicators === "function") switchToIndicators(code);
    });
  }
}

function _setupFocusTrap(panel) {
  var focusables = panel.querySelectorAll('button, span.risk-detail-indicator-link');
  if (focusables.length === 0) return;
  var firstFocusable = focusables[0];
  var lastFocusable = focusables[focusables.length - 1];

  panel.addEventListener("keydown", function(e) {
    if (e.key !== "Tab") return;
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  });
}

function _onDetailEscape(e) {
  if (e.key === "Escape") _closeDetail();
}

function _closeDetail() {
  _detailOpen = false;
  var panel = document.getElementById("riskDetailPanel");
  var overlay = document.getElementById("riskDetailOverlay");
  if (panel) panel.remove();
  if (overlay) overlay.remove();

  document.removeEventListener("keydown", _onDetailEscape);
  document.body.classList.remove("body-scroll-lock");

  if (_lastActiveElement && typeof _lastActiveElement.focus === "function") {
    _lastActiveElement.focus();
  }
  _lastActiveElement = null;
}

function _buildSupportPanel() {
  var panel = document.createElement("div");
  panel.className = "risk-support-panel";
  panel.innerHTML = '<div class="risk-support-title">Indicadores de Suporte / Efetividade</div><div class="risk-support-grid">' + _supportIndicators().map(function (s) {
    return '<div class="risk-support-item"><span class="sup-code">' + s.code + '</span><span class="sup-name">' + s.name + "</span></div>";
  }).join("") + '</div><div class="risk-support-note">Estes indicadores (I03, I04, I05, I06, I09, I10) n\u00e3o mapeiam para uma causa individual. S\u00e3o exibidos como camada de suporte \u00e0 matriz, mensurando efetividade global dos controles.</div>';
  return panel;
}

function _supportIndicators() {
  var codes = ["I03", "I04", "I05", "I06", "I09", "I10"];
  return codes.filter(function (c) { return dashboardData && dashboardData[c]; }).map(function (c) { return { code: c, name: dashboardData[c].name }; });
}

function _buildLegend() {
  const cfg = typeof getRiskConfig === "function" ? getRiskConfig() : (typeof window !== "undefined" && window._riskConfig ? window._riskConfig : null);
  const leg = document.createElement("div");
  leg.className = "risk-matrix-legend";
  const colorMap = {
    verde: "Verde (1\u20133) \u2014 Médio ou Baixo",
    amarelo: "Amarelo (4\u20136) \u2014 Médio",
    vermelho: "Vermelho (7\u20139) \u2014 Alto"
  };
  let html = '<div style="font-weight:600;color:var(--text-primary);font-size:12px;margin-right:8px">Faixas de Score Residual:</div>';
  Object.keys(colorMap).forEach(function (k) {
    html += '<div class="risk-legend-item"><span class="risk-legend-swatch lvl-' + k + '"></span><span class="risk-legend-text">' + colorMap[k] + '</span></div>';
  });

  html += '<div style="margin-left:auto"></div>';
  html += '<div class="risk-legend-item"><span class="risk-legend-swatch lvl-sem-dado"></span><span class="risk-legend-text">Sem indicador <span style="color:var(--text-secondary)">(contorno tracejado)</span></span></div>';
  html += '<div class="risk-legend-item"><span class="risk-legend-text" style="font-size:10px;color:#a6790a">\u26a0\ufe0f Impactos n\u00e3o validados pela PRGA</span></div>';

  if (cfg && cfg.thresholds && cfg.thresholds.impacto && cfg.thresholds.impacto.niveis) {
    var impNiveis = cfg.thresholds.impacto.niveis;
    html += '<div class="risk-legend-divider"></div>';
    html += '<div style="font-weight:600;color:var(--text-primary);font-size:12px;margin-right:8px">Escala de Impacto:</div>';
    impNiveis.forEach(function (n) {
      html += '<div class="risk-legend-item"><span class="risk-legend-text"><b>' + n.nivel + '</b> ' + n.rotulo + ' — ' + n.descricao + '</span></div>';
    });
  }

  leg.innerHTML = html;
  return leg;
}

function _buildCollapsedList(risks) {
  const list = document.createElement("div");
  list.className = "risk-collapsed-list";
  const sorted = risks.slice().sort((a, b) => {
    const sa = a.cod ? (a.probabilidadeResidual * a.impactoNum) : (a.score !== null ? a.score : 0);
    const sb = b.cod ? (b.probabilidadeResidual * b.impactoNum) : (b.score !== null ? b.score : 0);
    return sb - sa;
  });
  sorted.forEach((r) => {
    const item = document.createElement("div");
    item.className = "risk-collapsed-item";
    const isNew = !!r.cod;
    let scoreCls = "neutro";
    let scoreLabel = "—";
    let name = "";
    let metaText = "";

    if (isNew) {
      name = r.cod + " &mdash; " + r.evento;
      metaText = "Inerente: " + r.nivelInerente + " &mdash; Residual: " + r.nivelResidual;
      scoreLabel = r.probabilidadeResidual * r.impactoNum;
      if (r.nivelResidual === "Alto") scoreCls = "vermelho";
      else if (r.nivelResidual === "Médio") scoreCls = "amarelo";
      else if (r.nivelResidual === "Baixo") scoreCls = "verde";
    } else {
      name = r.nome;
      metaText = r.eventoNome + " &mdash; Impacto " + r.impacto + "/3" + (r.probabilidade && r.probabilidade.nivel !== null ? " &mdash; Prob " + r.probabilidade.nivel + "/3" : ' \u2014 s/ prob');
      scoreCls = r.classificacao ? r.classificacao.cor : "neutro";
      scoreLabel = r.score !== null ? r.score : "—";
    }

    item.innerHTML = '<div class="rc-score sc-' + scoreCls + '">' + scoreLabel + '</div><div class="rc-info"><div class="rc-name">' + name + '</div><div class="rc-meta">' + metaText + '</div>' + (!isNew && r.indicador ? '<div class="rc-indicator">' + r.indicador + '</div>' : '') + '</div>';
    item.addEventListener("click", function () { _openDetail(r); });
    list.appendChild(item);
  });
  return list;
}

var _responsiveTimer = null;
function _renderResponsive() {
  clearTimeout(_responsiveTimer);
  _responsiveTimer = setTimeout(function () {
    var isNarrow = window.innerWidth <= 600;
    var grid = document.querySelector(".risk-grid-container");
    var list = document.querySelector(".risk-collapsed-list");
    if (grid && list) {
      grid.style.display = isNarrow ? "none" : "";
      list.style.display = isNarrow ? "flex" : "none";
    }
  }, 100);
}

function switchToIndicators(code) {
  var tab = document.querySelector('.view-tab[data-view="indicators"]');
  if (tab) tab.click();
  if (code && typeof els !== "undefined" && els.select) {
    setTimeout(function () {
      els.select.value = code;
      currentIndicator = code;
      if (typeof renderDashboard === "function") renderDashboard(code);
    }, 50);
  }
}
