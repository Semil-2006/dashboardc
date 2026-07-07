const fs = require("fs");
const path = require("path");
const { loadModelFunctions, createMockData } = require("./helpers");

function setupViewDOM() {
  document.body.innerHTML = `
    <select id="indicatorSelect"></select>
    <div id="mainChartTitle"></div>
    <div id="formula"></div>
    <div id="metaInfo"></div>
    <div id="semaforo"></div>
    <div id="kpiRow"></div>
    <div id="legend"></div>
    <div id="mainChart"></div>
    <div id="quarterLabels"></div>
    <div id="varsChart"></div>
    <div id="indicesChart"></div>
    <div id="qualidadeBody"></div>
    <div id="metodologiaBody"></div>
    <div id="dataTableBody"></div>
    <div id="periodHeader"></div>
    <div id="ttip"></div>
    <div class="year-pill" data-year="2023">
      <input type="checkbox" class="year-checkbox" value="2023" checked>
    </div>
    <div class="year-pill" data-year="2024">
      <input type="checkbox" class="year-checkbox" value="2024" checked>
    </div>
    <div id="dataTable">
      <thead><tr><th>Ano</th><th id="periodHeader">Período</th></tr></thead>
      <tbody id="dataTableBody"></tbody>
    </div>
  `;
}

function loadViewFunctions() {
  const model = loadModelFunctions();
  const mock = createMockData();

  const modelCode = fs.readFileSync(path.resolve(__dirname, "../model.js"), "utf-8");
  const viewCode = fs.readFileSync(path.resolve(__dirname, "../view.js"), "utf-8");

  const modelCleaned = modelCode
    .replace(/^let (YEARS|quadStatus|anualStatus|dashboardData|integrityPairs|yearColors);\s*$/gm, "");

  const combined = modelCleaned + "\n" + viewCode;

  const factory = new Function(
    "YEARS", "quadStatus", "anualStatus", "dashboardData", "integrityPairs", "yearColors",
    combined + `
      return {
        round1, isAnual, capitalize, buildSeries, validateIndicator, computeKpis,
        getLatestVarSnapshot, getBarWidth, formulas, ICONS,
        get currentIndicator() { return typeof currentIndicator !== "undefined" ? currentIndicator : undefined; },
        set currentIndicator(v) { if (typeof currentIndicator !== "undefined") currentIndicator = v; },
        toolbarState, varColor,
        els: typeof els !== "undefined" ? els : undefined,
        showTooltip: typeof showTooltip !== "undefined" ? showTooltip : undefined,
        hideTooltip: typeof hideTooltip !== "undefined" ? hideTooltip : undefined,
        positionTooltip: typeof positionTooltip !== "undefined" ? positionTooltip : undefined,
        animateNumber: typeof animateNumber !== "undefined" ? animateNumber : undefined,
        syncPillState: typeof syncPillState !== "undefined" ? syncPillState : undefined,
        renderKpis: typeof renderKpis !== "undefined" ? renderKpis : undefined,
        renderSemaforo: typeof renderSemaforo !== "undefined" ? renderSemaforo : undefined,
        renderQualidade: typeof renderQualidade !== "undefined" ? renderQualidade : undefined,
        renderMetodologia: typeof renderMetodologia !== "undefined" ? renderMetodologia : undefined,
        renderLegend: typeof renderLegend !== "undefined" ? renderLegend : undefined,
        buildBarTooltip: typeof buildBarTooltip !== "undefined" ? buildBarTooltip : undefined,
        addReferenceLines: typeof addReferenceLines !== "undefined" ? addReferenceLines : undefined,
        renderMainChart: typeof renderMainChart !== "undefined" ? renderMainChart : undefined,
        renderVarsChart: typeof renderVarsChart !== "undefined" ? renderVarsChart : undefined,
        renderIndicesChart: typeof renderIndicesChart !== "undefined" ? renderIndicesChart : undefined,
        renderTable: typeof renderTable !== "undefined" ? renderTable : undefined,
        renderDashboard: typeof renderDashboard !== "undefined" ? renderDashboard : undefined,
      };
    `
  );

  return factory(
    mock.YEARS, mock.quadStatus, mock.anualStatus,
    mock.dashboardData, mock.integrityPairs, mock.yearColors
  );
}

module.exports = { setupViewDOM, loadViewFunctions };
