const FilterToggleButton = require("../components/filter-toggle-button.js");

describe("FilterToggleButton Custom Element", () => {
  let sidebar;
  let closeBtn;
  let dashboard;
  let toggleBtn;

  beforeEach(() => {
    // Limpa o body
    document.body.innerHTML = "";

    // Configura elementos mockados do DOM
    dashboard = document.createElement("div");
    dashboard.className = "dashboard";

    const filterBar = document.createElement("div");
    filterBar.className = "filter-bar";

    toggleBtn = document.createElement("filter-toggle-button");
    toggleBtn.setAttribute("id", "filterToggleBtn");
    toggleBtn.setAttribute("title", "Filtros");
    toggleBtn.setAttribute("target-sidebar", "#filtersSidebar");
    toggleBtn.setAttribute("target-sidebar-close", "#filtersSidebarClose");
    toggleBtn.setAttribute("dashboard-container", ".dashboard");

    filterBar.appendChild(toggleBtn);
    dashboard.appendChild(filterBar);

    sidebar = document.createElement("div");
    sidebar.id = "filtersSidebar";
    sidebar.className = "filters-sidebar";

    closeBtn = document.createElement("button");
    closeBtn.id = "filtersSidebarClose";
    sidebar.appendChild(closeBtn);
    dashboard.appendChild(sidebar);

    document.body.appendChild(dashboard);

    // Conecta/Inicializa
    toggleBtn.connectedCallback();
  });

  test("renders internal button and custom svgs/text", () => {
    const button = toggleBtn.querySelector("button.filter-toggle-btn");
    expect(button).not.toBeNull();
    expect(button.title).toBe("Filtros");

    const chevronSvg = button.querySelector("svg.filter-icon-chevron");
    expect(chevronSvg).not.toBeNull();

    const funnelSvg = button.querySelector("svg.filter-icon-funnel");
    expect(funnelSvg).not.toBeNull();

    const textSpan = button.querySelector("span.filter-toggle-text");
    expect(textSpan).not.toBeNull();
    expect(textSpan.textContent).toBe("Filtros");
  });

  test("open() adds classes, hides button, and dispatches event", () => {
    const openEventMock = jest.fn();
    toggleBtn.addEventListener("filter-open", openEventMock);

    toggleBtn.open();

    expect(sidebar.classList.contains("open")).toBe(true);
    expect(dashboard.classList.contains("sidebar-open")).toBe(true);
    expect(toggleBtn.classList.contains("active")).toBe(true);
    expect(toggleBtn.style.display).toBe("none");
    expect(openEventMock).toHaveBeenCalled();
  });

  test("close() removes classes, shows button, and dispatches event", () => {
    const closeEventMock = jest.fn();
    toggleBtn.addEventListener("filter-close", closeEventMock);

    // Abre primeiro
    toggleBtn.open();

    // Fecha
    toggleBtn.close();

    expect(sidebar.classList.contains("open")).toBe(false);
    expect(dashboard.classList.contains("sidebar-open")).toBe(false);
    expect(toggleBtn.classList.contains("active")).toBe(false);
    expect(toggleBtn.style.display).toBe("flex");
    expect(closeEventMock).toHaveBeenCalled();
  });

  test("toggle() toggles open/close state", () => {
    expect(sidebar.classList.contains("open")).toBe(false);

    toggleBtn.toggle();
    expect(sidebar.classList.contains("open")).toBe(true);

    toggleBtn.toggle();
    expect(sidebar.classList.contains("open")).toBe(false);
  });

  test("clicking toggle button toggles state", () => {
    const button = toggleBtn.querySelector("button.filter-toggle-btn");
    button.click();
    expect(sidebar.classList.contains("open")).toBe(true);

    button.click();
    expect(sidebar.classList.contains("open")).toBe(false);
  });

  test("clicking close button closes sidebar", () => {
    toggleBtn.open();
    expect(sidebar.classList.contains("open")).toBe(true);

    closeBtn.click();
    expect(sidebar.classList.contains("open")).toBe(false);
  });

  test("clicking outside sidebar and toggle button closes sidebar", () => {
    toggleBtn.open();
    expect(sidebar.classList.contains("open")).toBe(true);

    // Clica em um elemento fora
    const outsideEl = document.createElement("div");
    document.body.appendChild(outsideEl);
    outsideEl.click();

    expect(sidebar.classList.contains("open")).toBe(false);
  });

  test("clicking inside sidebar does not close it", () => {
    toggleBtn.open();
    expect(sidebar.classList.contains("open")).toBe(true);

    sidebar.click();
    expect(sidebar.classList.contains("open")).toBe(true);
  });
});
