const fs = require("fs");
const path = require("path");
const { createMockData } = require("./helpers");

function setupControllerDOM() {
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
    <div class="visual-toolbar" data-target="mainChart">
      <div class="chart-card"></div>
    </div>
    <div class="chart-card" id="mainChartCard">
      <div class="visual-toolbar" data-target="mainChart"></div>
    </div>
    <div class="chart-card" id="varsChartCard">
      <div class="visual-toolbar" data-target="varsChart"></div>
    </div>
    <div class="chart-card" id="indicesChartCard">
      <div class="visual-toolbar" data-target="indicesChart"></div>
    </div>
  `;
}

function loadControllerFunctions() {
  const mock = createMockData();
  const modelCode = fs.readFileSync(path.resolve(__dirname, "../model.js"), "utf-8");
  const viewCode = fs.readFileSync(path.resolve(__dirname, "../view.js"), "utf-8");
  const controllerCode = fs.readFileSync(path.resolve(__dirname, "../controller.js"), "utf-8");

  const modelCleaned = modelCode
    .replace(/^let (YEARS|quadStatus|anualStatus|dashboardData|integrityPairs|yearColors);\s*$/gm, "");

  const combined = modelCleaned + "\n" + viewCode + "\n" + controllerCode;

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
        showTooltip, hideTooltip, positionTooltip, animateNumber, syncPillState,
        renderKpis, renderSemaforo, renderQualidade, renderMetodologia, renderLegend,
        buildBarTooltip, addReferenceLines, renderMainChart, renderVarsChart,
        renderIndicesChart, renderTable, renderDashboard,
        buildVisualMenuHTML: typeof buildVisualMenuHTML !== "undefined" ? buildVisualMenuHTML : undefined,
        closeAllVisualMenus: typeof closeAllVisualMenus !== "undefined" ? closeAllVisualMenus : undefined,
        toggleTableView: typeof toggleTableView !== "undefined" ? toggleTableView : undefined,
        buildMainTableHTML: typeof buildMainTableHTML !== "undefined" ? buildMainTableHTML : undefined,
        buildVarsTableHTML: typeof buildVarsTableHTML !== "undefined" ? buildVarsTableHTML : undefined,
        buildIndicesTableHTML: typeof buildIndicesTableHTML !== "undefined" ? buildIndicesTableHTML : undefined,
        exportVisualData: typeof exportVisualData !== "undefined" ? exportVisualData : undefined,
        collapseExpand: typeof collapseExpand !== "undefined" ? collapseExpand : undefined,
        toggleExpand: typeof toggleExpand !== "undefined" ? toggleExpand : undefined,
        removeVisual: typeof removeVisual !== "undefined" ? removeVisual : undefined,
        handleVisualSort: typeof handleVisualSort !== "undefined" ? handleVisualSort : undefined,
        initVisualToolbars: typeof initVisualToolbars !== "undefined" ? initVisualToolbars : undefined,
      };
    `
  );

  return factory(
    mock.YEARS, mock.quadStatus, mock.anualStatus,
    mock.dashboardData, mock.integrityPairs, mock.yearColors
  );
}

module.exports = { setupControllerDOM, loadControllerFunctions };
