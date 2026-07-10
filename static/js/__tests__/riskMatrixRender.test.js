const fs = require("fs");
const path = require("path");
const { createMockData } = require("./helpers");

const mock = createMockData();

// Mock do riskConfig enriquecido para os testes de renderização
const mockRiskConfig = {
  eventos: {
    desvio_conduta: {
      nome: "Desvio de Conduta",
      causas: [
        {
          id: "assedio_moral",
          nome: "Assédio Moral",
          indicador: "I01",
          impacto: 3,
          justificativa: "Sanção administrativa",
          validado: true,
          statusTratamento: "Em Tratamento",
          dono: "PRGA",
          prazo: "2026-12-31",
          "planoAcao": "Plano de teste contra assédio.",
          reavaliacoes: [
            { "data": "2025-12-31", "score": 12 },
            { "data": "2026-06-30", "score": 9 }
          ]
        },
        {
          id: "assedio_sexual_sem_reval",
          nome: "Assédio Sexual Sem Reval",
          indicador: "I02",
          impacto: 5,
          justificativa: "Grave dano",
          validado: true,
          statusTratamento: "Pendente",
          dono: "PRGA",
          prazo: "2026-12-31",
          "planoAcao": "Outro plano de teste.",
          reavaliacoes: [] // Sem histórico
        },
        {
          id: "furto_bens_escanteio",
          nome: "Furto de Bens Patrimoniais",
          indicador: null,
          impacto: 3,
          justificativa: "Dano financeiro",
          validado: false
        }
      ]
    }
  },
  thresholds: {
    probabilidade: {
      coletasMinimas: 3,
      niveis: [
        { nivel: 1, rotulo: "Baixa", descricao: "test" },
        { nivel: 2, rotulo: "Baixa-Média", descricao: "test" },
        { nivel: 3, rotulo: "Média", descricao: "test" },
        { nivel: 4, rotulo: "Alta", descricao: "test" },
        { nivel: 5, rotulo: "Muito Alta", descricao: "test" }
      ]
    },
    score: {
      faixas: [
        { min: 1, max: 4, cor: "verde", rotulo: "Baixo" },
        { min: 5, max: 9, cor: "amarelo", rotulo: "Moderado" },
        { min: 10, max: 15, cor: "laranja", rotulo: "Alto" },
        { min: 16, max: 25, cor: "vermelho", rotulo: "Crítico" }
      ]
    }
  }
};

function setupGlobals() {
  global.YEARS = mock.YEARS;
  global.dashboardData = mock.dashboardData;
  global.quadStatus = mock.quadStatus;
  global.anualStatus = mock.anualStatus;
  global.integrityPairs = mock.integrityPairs;
  global.yearColors = mock.yearColors;
  global.currentIndicator = "I01";
  global.toolbarState = {};
  
  global.isAnual = function (code) { return global.dashboardData[code].periodicidade === "Anual"; };
  global.round1 = function (n) { return Math.round(n * 10) / 10; };
  global.buildSeries = function (code) { return { "2023": [10, 20, 30] }; };
  
  global._riskConfig = mockRiskConfig;
  
  // Mock das funções de tooltip
  global.showTooltip = jest.fn();
  global.positionTooltip = jest.fn();
  global.hideTooltip = jest.fn();
  global.switchToIndicators = jest.fn();
}

function loadScript(filePath) {
  const code = fs.readFileSync(path.resolve(__dirname, filePath), "utf-8");
  const factory = new Function("window", "document", `
    ${code}
    return {
      _openDetail: typeof _openDetail !== "undefined" ? _openDetail : undefined,
      _closeDetail: typeof _closeDetail !== "undefined" ? _closeDetail : undefined,
      _setupFocusTrap: typeof _setupFocusTrap !== "undefined" ? _setupFocusTrap : undefined,
      _onDetailEscape: typeof _onDetailEscape !== "undefined" ? _onDetailEscape : undefined
    };
  `);
  return factory(global, document);
}

describe("Quadro de Riscos - Renderização e Acessibilidade do Modal", () => {
  let riskLogic;
  let renderModule;

  beforeAll(() => {
    setupGlobals();
    
    // Carrega a lógica estatística do riskMatrix.js
    const logicCode = fs.readFileSync(path.resolve(__dirname, "../../risk-matrix/riskMatrix.js"), "utf-8");
    const logicFactory = new Function(`
      ${logicCode}
      return {
        computeProbability,
        classifyScore,
        computeScore,
        computeAllRisks,
        getCausas
      };
    `);
    riskLogic = logicFactory();
    
    // Mocka o computeAllRisks e classifyScore globais para o render.js usar
    global.computeAllRisks = riskLogic.computeAllRisks;
    global.classifyScore = riskLogic.classifyScore;
    
    // Carrega o módulo de renderização
    renderModule = loadScript("../../risk-matrix/riskMatrix.render.js");
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="riskMatrixBody"></div>
      <button id="triggerBtn">Abrir Modal</button>
    `;
    document.getElementById("triggerBtn").focus();
  });

  afterEach(() => {
    // Garante que o modal seja fechado/removido do DOM entre os testes
    if (renderModule && typeof renderModule._closeDetail === "function") {
      renderModule._closeDetail();
    }
  });

  test("Cenário 1: Risco com indicador e histórico populado", () => {
    const risks = riskLogic.computeAllRisks();
    const risk = risks.find(r => r.id === "assedio_moral");
    
    // Simula a abertura
    renderModule._openDetail(risk);

    const panel = document.getElementById("riskDetailPanel");
    const overlay = document.getElementById("riskDetailOverlay");
    
    expect(panel).toBeTruthy();
    expect(overlay).toBeTruthy();
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-modal")).toBe("true");

    // Verifica os dados de governança na tela
    expect(panel.innerHTML).toContain("PRGA");
    expect(panel.innerHTML).toContain("Em Tratamento");
    expect(panel.innerHTML).toContain("Plano de teste contra assédio.");
    expect(panel.innerHTML).toContain("2026-12-31");

    // Verifica se a tabela de reavaliações foi desenhada na ordem decrescente de data
    const tableRows = panel.querySelectorAll(".risk-reval-table tbody tr");
    expect(tableRows.length).toBe(2);
    // Mais recente no topo: 2026-06-30
    expect(tableRows[0].cells[0].textContent).toBe("2026-06-30");
    expect(tableRows[0].cells[1].textContent).toBe("9");
    expect(tableRows[1].cells[0].textContent).toBe("2025-12-31");
  });

  test("Cenário 2: Risco com indicador mas sem histórico de reavaliações", () => {
    const risks = riskLogic.computeAllRisks();
    const risk = risks.find(r => r.id === "assedio_sexual_sem_reval");
    
    renderModule._openDetail(risk);

    const panel = document.getElementById("riskDetailPanel");
    expect(panel).toBeTruthy();
    
    // Verifica que a tabela não existe e a mensagem amigável é exibida
    expect(panel.querySelector(".risk-reval-table")).toBeNull();
    expect(panel.innerHTML).toContain("Nenhuma reavaliação anterior registrada para este risco.");
  });

  test("Cenário 3: Risco de escanteio (sem indicador)", () => {
    const risks = riskLogic.computeAllRisks();
    const risk = risks.find(r => r.id === "furto_bens_escanteio");
    
    renderModule._openDetail(risk);

    const panel = document.getElementById("riskDetailPanel");
    expect(panel).toBeTruthy();
    
    // Valida que o estado secundário/escanteio de integração futura é ativado
    expect(panel.innerHTML).toContain("Não implantado");
    expect(panel.innerHTML).toContain("Risco sem Indicador Quantitativo");
  });

  test("Acessibilidade: Focus check e Escape trigger", () => {
    const risks = riskLogic.computeAllRisks();
    const risk = risks.find(r => r.id === "assedio_moral");
    
    const trigger = document.getElementById("triggerBtn");
    trigger.focus();
    
    renderModule._openDetail(risk);

    // 1. O foco deve se mover para o título com tabindex -1
    const title = document.getElementById("riskModalTitle");
    expect(document.activeElement).toBe(title);

    // 2. Tecla Escape deve fechar o modal
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);
    
    expect(document.getElementById("riskDetailPanel")).toBeNull();
    
    // 3. Foco deve retornar ao gatilho original
    expect(document.activeElement).toBe(trigger);
  });

  test("Acessibilidade: Clique no backdrop (overlay) fecha o modal", () => {
    const risks = riskLogic.computeAllRisks();
    const risk = risks.find(r => r.id === "assedio_moral");
    
    renderModule._openDetail(risk);
    
    const overlay = document.getElementById("riskDetailOverlay");
    overlay.click();
    
    expect(document.getElementById("riskDetailPanel")).toBeNull();
  });
});
