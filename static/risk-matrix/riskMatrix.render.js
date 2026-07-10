let _detailOpen = false;
let _lastActiveElement = null;

function renderRiskMatrix() {
  const container = document.getElementById("riskMatrixBody");
  if (!container) return;
  const risks = computeAllRisks();
  if (!risks.length) {
    container.innerHTML = "<div style='padding:40px;text-align:center;color:var(--text-secondary)'>Carregando dados da Matriz de Riscos...</div>";
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
  area.innerHTML = '<div><div class="risk-matrix-title">Matriz de Calor</div><div class="risk-matrix-subtitle">Probabilidade \u00d7 Impacto — Classifica\u00e7\u00e3o de riscos por score (1–9)</div></div>';
  return area;
}

function _buildGrid(risks) {
  const wrapper = document.createElement("div");
  wrapper.className = "risk-grid-container";
  const impactLabels = ["Baixo", "Médio", "Alto"];
  const probLabels = ["Baixa", "Média", "Alta"];
  const header = document.createElement("div");
  header.className = "risk-grid-header";
  header.innerHTML = '<div class="risk-header-label">Prob → / Impacto ↓</div>' + impactLabels.map((l, i) => '<div class="risk-header-label">' + (i + 1) + ' ' + l + "</div>").join("");
  wrapper.appendChild(header);
  const body = document.createElement("div");
  body.className = "risk-grid-body";
  for (let prob = 3; prob >= 1; prob--) {
    const row = document.createElement("div");
    row.className = "risk-grid-row";
    const label = document.createElement("div");
    label.className = "risk-grid-row-label";
    label.innerHTML = '<span class="prob-num">' + prob + '</span> ' + probLabels[prob - 1];
    row.appendChild(label);
    for (let imp = 1; imp <= 3; imp++) {
      const score = prob * imp;
      const cls = classifyScore(score);
      const cell = document.createElement("div");
      cell.className = "risk-cell risk-" + cls.cor;
      cell.innerHTML = '<span class="cell-score">' + score + "</span>";
      const cellRisks = risks.filter(r => r.indicador && r.probabilidade && r.probabilidade.nivel === prob && r.impacto === imp);
      cellRisks.forEach(r => {
        cell.appendChild(_buildBadge(r));
      });
      row.appendChild(cell);
    }
    body.appendChild(row);
  }
  wrapper.appendChild(body);
  const noDataRisks = risks.filter(r => !r.indicador);
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
      const cellRisks = noDataRisks.filter(r => r.impacto === imp);
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
  const hasInd = !!risk.indicador;
  badge.className = "risk-badge " + (hasInd ? "has-indicator" : "no-indicator");
  badge.dataset.riskId = risk.id;
  badge.title = risk.nome;
  if (risk.probabilidade && risk.score !== null) {
    badge.textContent = risk.nome;
  } else {
    badge.innerHTML = '<span class="badge-count">!</span>' + risk.nome;
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
  var trendIcon = risk.trend || "";
  if (risk.indicador) {
    var status = risk.statusTratamento || "Pendente";
    return '<div class="tt-title">' + risk.nome + ' <span style="color:' + (risk.classificacao.cor === "vermelho" ? "var(--negative)" : risk.classificacao.cor === "amarelo" ? "#a6790a" : "var(--positive)") + '">' + trendIcon + '</span></div><div class="tt-row">Evento: ' + risk.eventoNome + "</div><div class='tt-row'>Indicador: <b>" + risk.indicador + "</b></div><div class='tt-row'>Probabilidade: <b>" + risk.probabilidade.rotulo + " (" + risk.probabilidade.nivel + "/3)</b></div><div class='tt-row'>Impacto: <b>" + risk.impacto + "/3</b> — " + risk.justificativa + "</div><div class='tt-row'>Score: <b>" + risk.score + "</b> — <b>" + risk.classificacao.rotulo + "</b></div><div class='tt-row'>Status: <b>" + status + "</b></div><div class='tt-row' style='border-top:1px solid var(--border-subtle);padding-top:4px;margin-top:4px;max-width:280px;white-space:normal'>" + risk.probabilidade.detalhe + "</div>";
  }
  var status = risk.statusTratamento || "Pendente";
  return '<div class="tt-title">' + risk.nome + ' <span style="color:#999">!</span></div><div class="tt-row">Evento: ' + risk.eventoNome + "</div><div class='tt-row'>Impacto: <b>" + risk.impacto + "/3</b></div><div class='tt-row'>Justificativa: <b>" + risk.justificativa + "</b></div><div class='tt-row'>Status: <b>" + status + "</b></div><div class='tt-row' style='color:var(--negative)'><b>Sem indicador implantado</b></div><div class='tt-row' style='border-top:1px solid var(--border-subtle);padding-top:4px;margin-top:4px;max-width:280px;white-space:normal'>Probabilidade não calculável — lacuna de dados identificada. Impacto baseado em avaliação qualitativa da PRGA.</div>";
}

function _openDetail(risk) {
  if (_detailOpen) _closeDetail();
  _detailOpen = true;
  _lastActiveElement = document.activeElement;

  var overlay = document.createElement("div");
  overlay.id = "riskDetailOverlay";
  overlay.style.cssText = "position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);";
  overlay.addEventListener("click", _closeDetail);
  document.body.appendChild(overlay);
  document.body.classList.add("body-scroll-lock");

  var panel = document.createElement("div");
  panel.className = "risk-detail-panel open";
  panel.id = "riskDetailPanel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "riskModalTitle");
  panel.setAttribute("aria-describedby", "riskModalDesc");

  var scoreCls = risk.classificacao ? risk.classificacao.cor : "neutro";
  var chipCls = "chip-" + scoreCls;
  
  var valHtml = "";
  if (!risk.validado) {
    valHtml = '<span class="risk-not-validated">Impacto não validado</span>';
  }

  // Fallbacks do Contrato de Dados
  var status = risk.statusTratamento || "Pendente";
  var dono = risk.dono || "Área não designada";
  var prazo = risk.prazo || "Prazo não definido";
  var plano = risk.planoAcao || "Nenhum plano de ação registrado.";
  var reavaliacoes = risk.reavaliacoes || [];
  var justificativa = risk.justificativa || "Justificativa de impacto não preenchida.";

  var innerHtml = '<button class="close-btn" aria-label="Fechar diálogo" onclick="_closeDetail()">&times;</button>';
  innerHtml += '<div class="risk-detail-header">';
  innerHtml += '  <h2 class="risk-detail-title" id="riskModalTitle" tabindex="-1" style="outline:none;">' + risk.nome + valHtml + '</h2>';
  innerHtml += '  <div class="risk-detail-evento" id="riskModalDesc">Categoria: ' + risk.eventoNome + '</div>';
  innerHtml += '</div>';

  innerHtml += '<div class="risk-detail-body">';

  if (risk.indicador) {
    // Layout de 2 colunas para riscos ativos
    innerHtml += '<div class="risk-detail-grid">';
    
    // Coluna 1: Análise Quantitativa
    innerHtml += '  <div class="risk-detail-col">';
    innerHtml += '    <div class="rd-section-title">1. Análise Quantitativa</div>';
    
    innerHtml += '    <div class="risk-detail-row">';
    innerHtml += '      <span class="rd-label">Indicador vinculado</span>';
    innerHtml += '      <span class="rd-value">';
    innerHtml += '        <span class="risk-detail-indicator-link" tabindex="0" aria-label="Navegar para o indicador ' + risk.indicador + '" data-code="' + risk.indicador + '">' + risk.indicador + ' &mdash; ' + dashboardData[risk.indicador].name + '</span>';
    innerHtml += '      </span>';
    innerHtml += '    </div>';

    innerHtml += '    <div class="risk-detail-row">';
    innerHtml += '      <span class="rd-label">Impacto atribuído (Fixo)</span>';
    innerHtml += '      <span class="rd-value">' + risk.impacto + '/3 <span class="rd-sub-label">(' + justificativa + ')</span></span>';
    innerHtml += '    </div>';

    var probVal = risk.probabilidade && risk.probabilidade.nivel !== null ? risk.probabilidade.rotulo + ' (' + risk.probabilidade.nivel + '/3)' : 'Não calculável';
    innerHtml += '    <div class="risk-detail-row">';
    innerHtml += '      <span class="rd-label">Probabilidade (Dinâmica)</span>';
    innerHtml += '      <span class="rd-value">' + probVal + '</span>';
    innerHtml += '    </div>';

    innerHtml += '    <div class="risk-detail-row">';
    innerHtml += '      <span class="rd-label">Score de Risco</span>';
    innerHtml += '      <span class="rd-value"><span class="risk-badge-chip ' + chipCls + '">' + (risk.score !== null ? risk.score : '—') + ' &mdash; ' + (risk.classificacao ? risk.classificacao.rotulo : 'Sem dado') + '</span></span>';
    innerHtml += '    </div>';

    innerHtml += '    <div class="risk-detail-row">';
    innerHtml += '      <span class="rd-label">Tendência de Evolução</span>';
    innerHtml += '      <span class="rd-value">' + (risk.trend || '—') + '</span>';
    innerHtml += '    </div>';

    if (risk.probabilidade && risk.probabilidade.detalhe) {
      innerHtml += '    <div class="risk-detail-observacao">' + risk.probabilidade.detalhe + '</div>';
    }
    innerHtml += '  </div>';

    // Coluna 2: Quadro de Riscos (Gestão PRGA)
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
    innerHtml += '      <span class="rd-value" style="white-space:normal;font-size:11px;line-height:1.4;color:var(--text-secondary);">' + plano + '</span>';
    innerHtml += '    </div>';
    innerHtml += '  </div>';
    
    innerHtml += '</div>'; // Fim do grid

    // Seção Histórico de Reavaliações
    innerHtml += '<div class="risk-reval-section">';
    innerHtml += '  <div class="rd-section-title">3. Histórico de Reavaliações</div>';
    if (reavaliacoes.length > 0) {
      // Ordenação decrescente por data
      var sortedReval = [...reavaliacoes].sort(function(a, b) {
        return new Date(b.data) - new Date(a.data);
      }).slice(0, 5);

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
    // Risco de escanteio / Sem indicador
    innerHtml += '<div class="risk-detail-escanteio">';
    innerHtml += '  <div class="risk-detail-row">';
    innerHtml += '    <span class="rd-label">Indicador vinculado</span>';
    innerHtml += '    <span class="rd-value" style="color:var(--negative);font-weight:600;">Não implantado</span>';
    innerHtml += '  </div>';
    innerHtml += '  <div class="risk-detail-row">';
    innerHtml += '    <span class="rd-label">Impacto atribuído (Fixo)</span>';
    innerHtml += '      <span class="rd-value">' + risk.impacto + '/3 <span class="rd-sub-label">(' + justificativa + ')</span></span>';
    innerHtml += '  </div>';
    innerHtml += '  <div class="risk-detail-row">';
    innerHtml += '    <span class="rd-label">Status de Tratamento</span>';
    innerHtml += '      <span class="rd-value"><span class="status-badge status-badge-' + status.toLowerCase().replace(/\s+/g, '-') + '">' + status + '</span></span>';
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

  innerHtml += '</div>'; // Fim do body

  panel.innerHTML = innerHtml;
  document.body.appendChild(panel);

  // Foco inicial no título
  var titleEl = document.getElementById("riskModalTitle");
  if (titleEl) titleEl.focus();

  // Focus trap setup
  _setupFocusTrap(panel);

  var link = panel.querySelector(".risk-detail-indicator-link");
  if (link) {
    // Evento de clique
    link.addEventListener("click", function () {
      var code = this.dataset.code;
      _closeDetail();
      switchToIndicators(code);
    });
    // Evento de teclado (Enter ou Space) para acessibilidade do link span
    link.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        var code = this.dataset.code;
        _closeDetail();
        switchToIndicators(code);
      }
    });
  }

  document.addEventListener("keydown", _onDetailEscape);
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
  var cfg = _rc();
  var panel = document.createElement("div");
  panel.className = "risk-support-panel";
  var codes = (cfg && cfg.indicadoresSuporte) ? cfg.indicadoresSuporte : ["I03", "I04", "I05", "I06", "I09", "I10"];
  var items = codes.filter(function (c) { return dashboardData && dashboardData[c]; }).map(function (c) {
    var ind = dashboardData[c];
    var series = typeof buildSeries === "function" ? buildSeries(c) : null;
    var kpi = series && typeof computeKpis === "function" ? computeKpis(series, YEARS, isAnual(c)) : null;
    var val = kpi && kpi.latestValue !== null ? kpi.latestValue + "%" : "—";
    var sense = ind.sentidoBom === "alto" ? "↑ maior melhor" : "↓ menor melhor";
    return '<div class="risk-support-item"><span class="sup-code">' + c + '</span><span class="sup-name">' + ind.name + '</span><span class="sup-meta">' + sense + '</span><span class="sup-value">' + val + '</span></div>';
  }).join("");
  panel.innerHTML = '<div class="risk-support-title">Indicadores de Suporte / Efetividade</div><div class="risk-support-grid">' + items + '</div><div class="risk-support-note">Estes indicadores (' + codes.join(", ") + ') não mapeiam para uma causa individual de risco. São exibidos como camada de suporte à matriz, mensurando efetividade global dos controles de integridade. Valores indicam o último dado disponível no painel de indicadores.</div>';
  return panel;
}

function _supportIndicators() {
  var codes = ["I03", "I04", "I05", "I06", "I09", "I10"];
  return codes.filter(function (c) { return dashboardData && dashboardData[c]; }).map(function (c) { return { code: c, name: dashboardData[c].name }; });
}

function _buildLegend() {
  var cfg = _rc();
  var leg = document.createElement("div");
  leg.className = "risk-matrix-legend";
  var colorMap = { verde: "Verde (1–3) — Baixo", amarelo: "Amarelo (4–6) — Médio", vermelho: "Vermelho (7–9) — Alto" };
  var html = '<div style="font-weight:600;color:var(--text-primary);font-size:12px;margin-right:8px">Faixas de Score:</div>';
  Object.keys(colorMap).forEach(function (k) {
    html += '<div class="risk-legend-item"><span class="risk-legend-swatch lvl-' + k + '"></span><span class="risk-legend-text">' + colorMap[k] + '</span></div>';
  });
  html += '<div style="margin-left:auto"></div>';
  html += '<div class="risk-legend-item"><span class="risk-legend-swatch lvl-sem-dado"></span><span class="risk-legend-text">Sem indicador <span style="color:var(--text-secondary)">(contorno tracejado)</span></span></div>';
  html += '<div class="risk-legend-item"><span class="risk-legend-text" style="font-size:10px;color:#a6790a">⚠️ Impactos não validados pela PRGA</span></div>';

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
  var list = document.createElement("div");
  list.className = "risk-collapsed-list";
  var sorted = risks.slice().sort(function (a, b) {
    var sa = a.score !== null ? a.score : 0;
    var sb = b.score !== null ? b.score : 0;
    return sb - sa;
  });
  sorted.forEach(function (r) {
    var item = document.createElement("div");
    item.className = "risk-collapsed-item";
    var scoreCls = r.classificacao ? r.classificacao.cor : "neutro";
    var scoreLabel = r.score !== null ? r.score : "\u2014";
    item.innerHTML = '<div class="rc-score sc-' + scoreCls + '">' + scoreLabel + '</div><div class="rc-info"><div class="rc-name">' + r.nome + '</div><div class="rc-meta">' + r.eventoNome + " &mdash; Impacto " + r.impacto + "/3" + (r.probabilidade && r.probabilidade.nivel !== null ? " &mdash; Prob " + r.probabilidade.nivel + "/3" : ' <span style="color:#999">\u2014 s/ prob</span>') + '</div>' + (r.indicador ? '<div class="rc-indicator">' + r.indicador + "</div>" : "") + "</div>";
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
