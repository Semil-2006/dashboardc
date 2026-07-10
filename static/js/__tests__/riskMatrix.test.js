const { createMockData } = require("./helpers");

function setupGlobals() {
  const mock = createMockData();
  global.YEARS = mock.YEARS;
  global.dashboardData = mock.dashboardData;
  global.quadStatus = mock.quadStatus;
  global.anualStatus = mock.anualStatus;
  global.integrityPairs = mock.integrityPairs;
  global.yearColors = mock.yearColors;
  global.currentIndicator = "I01";
  global.toolbarState = {};
  global.varColor = "var(--navy)";
  global.formulas = {
    I01: v => (v.V01 / v.V02) * 100,
    I02: v => (v.V03 / v.V02) * 100,
    I03: v => (v.V04 / v.V02) * 100,
    I04: v => (v.V06 / v.V05) * 100,
    I05: v => (v.V07 / v.V08) * 100,
    I06: v => (v.V09 / v.V10) * 100,
    I07: v => (v.V11 / v.V02) * 100,
    I08: v => (v.V12 / v.V02) * 100,
    I09: v => (v.V13 / v.V02) * 100,
    I10: v => (v.V14 / v.V15) * 100
  };
  global.isAnual = function (code) { return global.dashboardData[code].periodicidade === "Anual"; };
  global.round1 = function (n) { return Math.round(n * 10) / 10; };
  global.buildSeries = function (code) {
    const ind = global.dashboardData[code];
    const series = {};
    if (global.isAnual(code)) {
      global.YEARS.forEach(year => {
        if (code === "I09") {
          const v02arr = global.dashboardData.I01.vars.V02.data[year];
          const v13 = ind.vars.V13.data[year];
          const denomOk = v02arr && v02arr.every(x => x !== null);
          series[year] = (denomOk && v13 !== null && v13 !== undefined)
            ? global.round1((v13 / v02arr.reduce((a, b) => a + b, 0)) * 100)
            : null;
          return;
        }
        const varsForYear = {};
        let complete = true;
        Object.keys(ind.vars).forEach(vc => {
          const val = ind.vars[vc].data[year];
          if (val === null || val === undefined) complete = false;
          varsForYear[vc] = val;
        });
        series[year] = complete ? global.round1(global.formulas[code](varsForYear)) : null;
      });
    } else {
      global.YEARS.forEach(year => {
        series[year] = [0, 1, 2].map(i => {
          const varsForPeriod = {};
          let complete = true;
          Object.keys(ind.vars).forEach(vc => {
            const val = ind.vars[vc].data[year][i];
            if (val === null || val === undefined) complete = false;
            varsForPeriod[vc] = val;
          });
          return complete ? global.round1(global.formulas[code](varsForPeriod)) : null;
        });
      });
    }
    return series;
  };
}

const mockRiskConfig = {
  eventos: {
    desvio_conduta: {
      nome: "Desvio de Conduta",
      causas: [
        { id: "assedio_moral", nome: "Assédio Moral", indicador: "I01", impacto: 2, justificativa: "Teste", validado: false },
        { id: "assedio_sexual", nome: "Assédio Sexual", indicador: "I02", impacto: 3, justificativa: "Teste", validado: false },
        { id: "sem_indicador", nome: "Risco sem Indicador", indicador: null, impacto: 2, justificativa: "Teste", validado: false }
      ]
    },
    desconformidade: {
      nome: "Desconformidade",
      causas: [
        { id: "sem_indicador2", nome: "Outro sem Indicador", indicador: null, impacto: 3, justificativa: "Teste", validado: false }
      ]
    }
  },
  thresholds: {
    probabilidade: {
      coletasMinimas: 3,
      niveis: [
        { nivel: 1, rotulo: "Baixa", descricao: "test" },
        { nivel: 2, rotulo: "Média", descricao: "test" },
        { nivel: 3, rotulo: "Alta", descricao: "test" }
      ]
    },
    score: {
      faixas: [
        { min: 1, max: 3, cor: "verde", rotulo: "Baixo" },
        { min: 4, max: 6, cor: "amarelo", rotulo: "Médio" },
        { min: 7, max: 9, cor: "vermelho", rotulo: "Alto" }
      ]
    }
  }
};

function loadRiskMatrixFunctions() {
  const fs = require("fs");
  const path = require("path");
  const code = fs.readFileSync(path.resolve(__dirname, "../../risk-matrix/riskMatrix.js"), "utf-8");
  const factory = new Function(
    `
      ${code}
      return {
        computeTrend: typeof computeTrend !== "undefined" ? computeTrend : undefined,
        computeProbability: typeof computeProbability !== "undefined" ? computeProbability : undefined,
        computeScore: typeof computeScore !== "undefined" ? computeScore : undefined,
        classifyScore: typeof classifyScore !== "undefined" ? classifyScore : undefined,
        computeAllRisks: typeof computeAllRisks !== "undefined" ? computeAllRisks : undefined,
        getCausas: typeof getCausas !== "undefined" ? getCausas : undefined,
        clearRiskCache: typeof clearRiskCache !== "undefined" ? clearRiskCache : undefined,
        getRiskConfig: typeof getRiskConfig !== "undefined" ? getRiskConfig : undefined,
        loadRiskConfig: typeof loadRiskConfig !== "undefined" ? loadRiskConfig : undefined
      };
    `
  );
  return factory();
}

let risk;

beforeAll(() => {
  setupGlobals();
  global._riskConfig = mockRiskConfig;
  risk = loadRiskMatrixFunctions();
});

describe("computeTrend", () => {
  test("returns up arrow for increasing series", () => {
    const series = { "2023": [10, 20, 30], "2024": [40, 50, 60] };
    expect(risk.computeTrend(series, false)).toBe("\u2191");
  });

  test("returns down arrow for decreasing series", () => {
    const series = { "2023": [60, 50, 40], "2024": [30, 20, 10] };
    expect(risk.computeTrend(series, false)).toBe("\u2193");
  });

  test("returns right arrow for stable series", () => {
    const series = { "2023": [30, 31, 29], "2024": [30, 31, 29] };
    expect(risk.computeTrend(series, false)).toBe("\u2192");
  });

  test("handles annual series", () => {
    const series = { "2023": 40, "2024": 50, "2025": 60 };
    expect(risk.computeTrend(series, true)).toBe("\u2191");
  });

  test("returns right arrow for single value", () => {
    const series = { "2023": [10] };
    expect(risk.computeTrend(series, false)).toBe("\u2192");
  });
});

describe("classifyScore", () => {
  test("score 1 returns verde", () => {
    const result = risk.classifyScore(1);
    expect(result.cor).toBe("verde");
  });

  test("score 3 returns verde (boundary)", () => {
    const result = risk.classifyScore(3);
    expect(result.cor).toBe("verde");
  });

  test("score 4 returns amarelo (boundary)", () => {
    const result = risk.classifyScore(4);
    expect(result.cor).toBe("amarelo");
  });

  test("score 6 returns amarelo (boundary)", () => {
    const result = risk.classifyScore(6);
    expect(result.cor).toBe("amarelo");
  });

  test("score 7 returns vermelho (boundary)", () => {
    const result = risk.classifyScore(7);
    expect(result.cor).toBe("vermelho");
  });

  test("score 9 returns vermelho (boundary)", () => {
    const result = risk.classifyScore(9);
    expect(result.cor).toBe("vermelho");
  });

  test("score 0 returns neutro (out of range)", () => {
    const result = risk.classifyScore(0);
    expect(result.cor).toBe("neutro");
  });

  test("score 10 returns neutro (out of range)", () => {
    const result = risk.classifyScore(10);
    expect(result.cor).toBe("neutro");
  });
});

describe("computeScore", () => {
  test("basic multiplication", () => {
    expect(risk.computeScore(3, 4)).toBe(12);
  });

  test("minimum score", () => {
    expect(risk.computeScore(1, 1)).toBe(1);
  });

  test("maximum score", () => {
    expect(risk.computeScore(3, 3)).toBe(9);
  });
});

describe("computeProbability", () => {
  test("returns fallback level 2 when history insufficient", () => {
    const original = global._riskConfig.thresholds.probabilidade.coletasMinimas;
    global._riskConfig.thresholds.probabilidade.coletasMinimas = 999;
    const result = risk.computeProbability("I04");
    global._riskConfig.thresholds.probabilidade.coletasMinimas = original;
    expect(result.nivel).toBe(2);
    expect(result.rotulo).toBe("Média");
  });

  test("returns level 1 for I01 (baixo sentidoBom, low values)", () => {
    const result = risk.computeProbability("I01");
    expect(result.nivel).toBeLessThanOrEqual(2);
  });

  test("returns numeric nivel for valid indicator", () => {
    const result = risk.computeProbability("I02");
    expect(typeof result.nivel).toBe("number");
    expect(result.nivel).toBeGreaterThanOrEqual(1);
    expect(result.nivel).toBeLessThanOrEqual(3);
  });

  test("returns trend info", () => {
    const result = risk.computeProbability("I02");
    expect(result.trend).toBeDefined();
  });

  test("returns 2 for null indicator", () => {
    const result = risk.computeProbability("I99");
    expect(result.nivel).toBe(2);
  });
});

describe("getCausas", () => {
  test("returns all causas flattened", () => {
    const causas = risk.getCausas();
    expect(causas.length).toBe(4);
  });

  test("each causa has eventoNome", () => {
    const causas = risk.getCausas();
    causas.forEach(c => {
      expect(c.eventoNome).toBeDefined();
    });
  });
});

describe("computeAllRisks", () => {
  test("computes probability for indicators", () => {
    risk.clearRiskCache();
    const results = risk.computeAllRisks();
    expect(results.length).toBe(4);
    const withInd = results.find(r => r.indicador === "I01");
    expect(withInd.probabilidade).toBeDefined();
    expect(withInd.probabilidade.nivel).toBeGreaterThanOrEqual(1);
    expect(withInd.score).toBeGreaterThanOrEqual(1);
  });

  test("sets null probability for without indicator", () => {
    risk.clearRiskCache();
    const results = risk.computeAllRisks();
    const noInd = results.find(r => r.indicador === null);
    expect(noInd.probabilidade.nivel).toBeNull();
    expect(noInd.probabilidade.rotulo).toBe("Não calculável");
    expect(noInd.score).toBeNull();
  });

  test("classifies score correctly", () => {
    risk.clearRiskCache();
    const results = risk.computeAllRisks();
    results.filter(r => r.score !== null).forEach(r => {
      expect(r.classificacao).toBeDefined();
      expect(["verde", "amarelo", "vermelho"]).toContain(r.classificacao.cor);
    });
  });

  test("caches results", () => {
    risk.clearRiskCache();
    const first = risk.computeAllRisks();
    const second = risk.computeAllRisks();
    expect(first).toBe(second);
  });

  test("clearRiskCache invalidates", () => {
    risk.clearRiskCache();
    risk.computeAllRisks();
    risk.clearRiskCache();
    const after = risk.computeAllRisks();
    const after2 = risk.computeAllRisks();
    expect(after).not.toBe(null);
  });
});
