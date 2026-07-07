const { createMockData } = require("./helpers");

const mock = createMockData();

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
    <div class="chart-card" id="mainChartCard">
      <div class="visual-toolbar" data-target="mainChart"></div>
      <div class="main-chart" id="mainChart"></div>
      <div id="quarterLabels"></div>
    </div>
    <div class="chart-card" id="varsChartCard">
      <div class="visual-toolbar" data-target="varsChart"></div>
    </div>
    <div class="chart-card" id="indicesChartCard">
      <div class="visual-toolbar" data-target="indicesChart"></div>
    </div>
  `;
}

let ctrl;

beforeAll(() => {
  setupControllerDOM();

  globalThis.YEARS = mock.YEARS;
  globalThis.dashboardData = mock.dashboardData;
  globalThis.quadStatus = mock.quadStatus;
  globalThis.anualStatus = mock.anualStatus;
  globalThis.integrityPairs = mock.integrityPairs;
  globalThis.yearColors = mock.yearColors;
  globalThis.currentIndicator = "I01";
  globalThis.toolbarState = {};
  globalThis.requestAnimationFrame = jest.fn(() => 1);
  globalThis.performance = { now: jest.fn(() => 0) };
  globalThis.setTimeout = jest.fn(cb => { cb(); return 1; });
  globalThis.clearTimeout = jest.fn();
  globalThis.setInterval = jest.fn();
  globalThis.clearInterval = jest.fn();
  globalThis.Math = Math;
  globalThis.URL = {
    createObjectURL: jest.fn(() => "blob:test"),
    revokeObjectURL: jest.fn(),
  };
  globalThis.Blob = jest.fn((parts, opts) => ({ parts, opts }));

  delete require.cache[require.resolve("../model.js")];
  delete require.cache[require.resolve("../view.js")];
  delete require.cache[require.resolve("../controller.js")];

  const model = require("../model.js");
  for (const k of Object.getOwnPropertyNames(model)) {
    globalThis[k] = model[k];
  }

  const view = require("../view.js");
  for (const k of Object.getOwnPropertyNames(view)) {
    if (typeof view[k] === "function") {
      globalThis[k] = view[k];
    }
  }

  ctrl = require("../controller.js");
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("buildVisualMenuHTML", () => {
  test("returns menu HTML string", () => {
    const html = ctrl.buildVisualMenuHTML("mainChart");
    expect(html).toContain("Exportar dados");
    expect(html).toContain("Remover");
    expect(html).toContain("Destaque");
  });

  test("includes sort options", () => {
    const html = ctrl.buildVisualMenuHTML("mainChart");
    expect(html).toContain("decrescente");
    expect(html).toContain("crescente");
  });

  test("shows check mark when sort active", () => {
    globalThis.toolbarState["testChart"] = { sort: "desc" };
    const html = ctrl.buildVisualMenuHTML("testChart");
    expect(html).toContain("✓");
    expect(html).toContain("decrescente");
  });
});

describe("closeAllVisualMenus", () => {
  test("removes open class from menus", () => {
    const menu = document.createElement("div");
    menu.className = "visual-menu open";
    document.body.appendChild(menu);

    const toolbar = document.createElement("div");
    toolbar.className = "visual-toolbar menu-open";
    document.body.appendChild(toolbar);

    ctrl.closeAllVisualMenus();
    expect(menu.classList.contains("open")).toBe(false);
    expect(toolbar.classList.contains("menu-open")).toBe(false);
  });
});

describe("exportVisualData", () => {
  test("exports CSV for mainChart", () => {
    ctrl.exportVisualData("mainChart");
    expect(globalThis.Blob).toHaveBeenCalled();
  });

  test("exports CSV for indicesChart", () => {
    ctrl.exportVisualData("indicesChart");
    expect(globalThis.Blob).toHaveBeenCalled();
  });
});

describe("buildMainTableHTML", () => {
  test("generates HTML table with proper structure", () => {
    const html = ctrl.buildMainTableHTML();
    expect(html).toContain("<table");
    expect(html).toContain("Valor");
    expect(html).toContain("Variação");
    expect(html).toContain("Status");
  });
});

describe("buildVarsTableHTML", () => {
  test("shows variables table with data for I01", () => {
    const html = ctrl.buildVarsTableHTML();
    expect(html).toContain("<table");
    expect(html).toContain("Código");
  });
});

describe("buildIndicesTableHTML", () => {
  test("generates indices comparison table", () => {
    const html = ctrl.buildIndicesTableHTML();
    expect(html).toContain("<table");
    expect(html).toContain("Código");
    expect(html).toContain("Nome do Indicador");
    expect(html).toContain("Periodicidade");
    expect(html).toContain("Referência");
    expect(html).toContain("Valor");
  });

  test("includes all 10 indicators", () => {
    const html = ctrl.buildIndicesTableHTML();
    for (let i = 1; i <= 10; i++) {
      const code = `I${String(i).padStart(2, "0")}`;
      expect(html).toContain(code);
    }
  });
});

describe("handleVisualSort", () => {
  test("sets sort state in toolbarState", () => {
    ctrl.handleVisualSort("testTarget", "desc");
    expect(globalThis.toolbarState["testTarget"].sort).toBe("desc");

    ctrl.handleVisualSort("testTarget", "asc");
    expect(globalThis.toolbarState["testTarget"].sort).toBe("asc");
  });
});
