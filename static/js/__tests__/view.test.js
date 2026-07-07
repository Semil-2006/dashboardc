const { createMockData } = require("./helpers");

const mock = createMockData();

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

let view;

beforeAll(() => {
  setupViewDOM();

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
  globalThis.Math = Math;

  delete require.cache[require.resolve("../model.js")];
  delete require.cache[require.resolve("../view.js")];

  const model = require("../model.js");
  for (const k of Object.getOwnPropertyNames(model)) {
    globalThis[k] = model[k];
  }

  view = require("../view.js");
});

afterAll(() => {
  const keys = [
    "YEARS","dashboardData","quadStatus","anualStatus","integrityPairs","yearColors",
    "currentIndicator","toolbarState","requestAnimationFrame","performance","setTimeout","clearTimeout",
    ...Object.keys(require.cache[require.resolve("../model.js")] || {}),
  ];
  keys.forEach(k => delete globalThis[k]);
  jest.restoreAllMocks();
});

describe("els", () => {
  test("all DOM elements are found", () => {
    expect(view.els).toBeDefined();
    expect(view.els.ttip).toBeDefined();
    expect(view.els.kpiRow).toBeDefined();
    expect(view.els.chart).toBeDefined();
  });
});

describe("showTooltip", () => {
  test("sets tooltip content and shows it", () => {
    view.showTooltip({ clientX: 100, clientY: 200 }, "Test tooltip");
    expect(view.els.ttip.innerHTML).toBe("Test tooltip");
    expect(view.els.ttip.style.display).toBe("block");
    view.hideTooltip();
  });
});

describe("hideTooltip", () => {
  test("removes visible class", () => {
    view.els.ttip.classList.add("visible");
    view.hideTooltip();
    expect(view.els.ttip.classList.contains("visible")).toBe(false);
  });
});

describe("renderSemaforo", () => {
  afterEach(() => {
    view.els.semaforo.className = "";
    view.els.semaforo.innerHTML = "";
  });

  test("renders neutro when no data", () => {
    view.renderSemaforo("I01", null);
    expect(view.els.semaforo.className).toContain("neutro");
  });

  test("renders verde when within meta for baixo sentido", () => {
    view.renderSemaforo("I01", 15);
    expect(view.els.semaforo.className).toContain("verde");
  });

  test("renders amarelo when within acceptable for baixo sentido", () => {
    view.renderSemaforo("I01", 25);
    expect(view.els.semaforo.className).toContain("amarelo");
  });

  test("renders vermelho when out of bounds for baixo sentido", () => {
    view.renderSemaforo("I01", 35);
    expect(view.els.semaforo.className).toContain("vermelho");
  });
});

describe("renderMetodologia", () => {
  test("shows periodicidade and formula", () => {
    view.renderMetodologia("I01");
    const html = view.els.metodologiaBody.innerHTML;
    expect(html).toContain("Quadrimestral");
    expect(html).toContain("Nenhuma observação");
  });

  test("shows observacao when present", () => {
    view.renderMetodologia("I02");
    const html = view.els.metodologiaBody.innerHTML;
    expect(html).toContain("Observação de teste");
  });
});

describe("renderLegend", () => {
  test("renders legend items for selected years", () => {
    view.renderLegend(["2023", "2024"]);
    const items = view.els.legend.querySelectorAll(".legend-item");
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain("2023");
    expect(items[1].textContent).toContain("2024");
  });

  test("creates swatch with year color", () => {
    view.renderLegend(["2023"]);
    const swatch = view.els.legend.querySelector(".legend-swatch");
    expect(swatch).toBeTruthy();
  });
});

describe("buildBarTooltip", () => {
  test("shows pending message for null value", () => {
    const html = view.buildBarTooltip("I01", "2026", "3º Quadrimestre", null, 2);
    expect(html).toContain("pendente");
  });

  test("includes formula calculation", () => {
    const html = view.buildBarTooltip("I01", "2023", "1º Quadrimestre", 40, 0);
    expect(html).toContain("40%");
    expect(html).toContain("(V01 / V02)");
  });
});

describe("renderQualidade", () => {
  test("shows qualidade items", () => {
    view.renderQualidade("I01");
    const html = view.els.qualidadeBody.innerHTML;
    expect(html).toContain("Coletas válidas");
    expect(html).toContain("39");
    expect(html).toContain("SharePoint");
  });
});

describe("renderKpis", () => {
  test("shows KPI cards with data", () => {
    const series = { "2023": [20, 25, 30], "2024": [35, 40, 45] };
    view.renderKpis(series, ["2023", "2024"], false);
    const cards = view.els.kpiRow.querySelectorAll(".kpi-card");
    expect(cards.length).toBeGreaterThan(0);
  });

  test("shows empty when no years selected", () => {
    view.renderKpis({}, [], false);
    expect(view.els.kpiRow.innerHTML).toBe("");
  });
});

describe("renderSemaforo - alto sentido", () => {
  test("renders verde when above meta", () => {
    view.renderSemaforo("I03", 90);
    expect(view.els.semaforo.className).toContain("verde");
  });

  test("renders amarelo when above acceptable", () => {
    view.renderSemaforo("I03", 75);
    expect(view.els.semaforo.className).toContain("amarelo");
  });

  test("renders vermelho when below acceptable", () => {
    view.renderSemaforo("I03", 50);
    expect(view.els.semaforo.className).toContain("vermelho");
  });
});

describe("renderTable", () => {
  test("renders quadrimestral table rows", () => {
    const series = { "2023": [20, 25, 30], "2024": [35, 40, 45] };
    view.renderTable("I01", series, ["2023", "2024"], false);
    const rows = view.els.tableBody.querySelectorAll("tr");
    expect(rows.length).toBe(6);
    expect(rows[0].textContent).toContain("2023");
  });

  test("renders anual table rows", () => {
    const series = { "2023": 50, "2024": 60 };
    view.renderTable("I04", series, ["2023", "2024"], true);
    const rows = view.els.tableBody.querySelectorAll("tr");
    expect(rows.length).toBe(2);
  });
});

describe("renderDashboard", () => {
  test("is a function", () => {
    expect(typeof view.renderDashboard).toBe("function");
  });
});
