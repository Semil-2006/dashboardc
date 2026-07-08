const fs = require("fs");
const path = require("path");

function createMockData() {
  const YEARS = ["2023", "2024", "2025", "2026"];
  const dashboardData = {
    I01: {
      name: "Percentual de denúncias de assédio moral",
      formula: "(V01 / V02) × 100",
      periodicidade: "Quadrimestral",
      granularidade: "Mensal, com consolidação quadrimestral",
      sentidoBom: "baixo",
      coletasValidas: 39,
      meta: 20,
      limiteAceitavel: 30,
      observacao: null,
      vars: {
        V01: { label: "Denúncias de assédio moral", data: { "2023": [6, 7, 7], "2024": [7, 6, 7], "2025": [5, 5, 4], "2026": [3, 3, null] } },
        V02: { label: "Total de denúncias", data: { "2023": [15, 18, 20], "2024": [22, 19, 24], "2025": [20, 23, 21], "2026": [18, 16, null] } },
      },
    },
    I02: {
      name: "Percentual de denúncias de assédio sexual",
      formula: "(V03 / V02) × 100",
      periodicidade: "Quadrimestral",
      granularidade: "Mensal, com consolidação quadrimestral",
      sentidoBom: "baixo",
      coletasValidas: 39,
      meta: 10,
      limiteAceitavel: 15,
      observacao: "Observação de teste",
      vars: {
        V03: { label: "Denúncias de assédio sexual", data: { "2023": [3, 3, 3], "2024": [4, 3, 3], "2025": [2, 2, 2], "2026": [1, 1, null] } },
        V02: { label: "Total de denúncias", data: { "2023": [15, 18, 20], "2024": [22, 19, 24], "2025": [20, 23, 21], "2026": [18, 16, null] } },
      },
    },
    I03: {
      name: "Efetividade de apuração de denúncias recebidas",
      formula: "(V04 / V02) × 100",
      periodicidade: "Quadrimestral",
      granularidade: "Mensal, com consolidação quadrimestral",
      sentidoBom: "alto",
      coletasValidas: 39,
      meta: 85,
      limiteAceitavel: 70,
      observacao: null,
      vars: {
        V04: { label: "Denúncias apuradas e tratadas", data: { "2023": [11, 13, 15], "2024": [17, 15, 20], "2025": [17, 20, 19], "2026": [17, 15, null] } },
        V02: { label: "Total de denúncias", data: { "2023": [15, 18, 20], "2024": [22, 19, 24], "2025": [20, 23, 21], "2026": [18, 16, null] } },
      },
    },
    I04: {
      name: "Atendimento da Lei 6.112/2018",
      formula: "(V06 / V05) × 100",
      periodicidade: "Anual",
      granularidade: "Anual",
      sentidoBom: "alto",
      coletasValidas: 3,
      meta: null,
      limiteAceitavel: null,
      observacao: null,
      vars: {
      V05: { label: "Contratos enviados à CGDF", data: { "2023": 40, "2024": 55, "2025": 60, "2026": null } },
      V06: { label: "Contratos enquadrados", data: { "2023": 26, "2024": 45, "2025": 58, "2026": null } },
      },
    },
    I05: {
      name: "Percentual de empregados treinados",
      formula: "(V07 / V08) × 100",
      periodicidade: "Anual",
      granularidade: "Anual",
      sentidoBom: "alto",
      coletasValidas: 3,
      meta: null,
      limiteAceitavel: null,
      observacao: null,
      vars: {
        V07: { label: "Empregados treinados", data: { "2023": 165, "2024": 250, "2025": 320, "2026": null } },
        V08: { label: "Total de empregados", data: { "2023": 300, "2024": 320, "2025": 340, "2026": null } },
      },
    },
    I06: {
      name: "Percentual de evasão no treinamento",
      formula: "(V09 / V10) × 100",
      periodicidade: "Anual",
      granularidade: "Anual",
      sentidoBom: "baixo",
      coletasValidas: 3,
      meta: null,
      limiteAceitavel: null,
      observacao: null,
      vars: {
        V09: { label: "Evasões", data: { "2023": 33, "2024": 25, "2025": 14, "2026": null } },
        V10: { label: "Vagas ofertadas", data: { "2023": 150, "2024": 180, "2025": 200, "2026": null } },
      },
    },
    I07: {
      name: "Percentual de denúncias de nepotismo",
      formula: "(V11 / V02) × 100",
      periodicidade: "Quadrimestral",
      granularidade: "Mensal, com consolidação quadrimestral",
      sentidoBom: "baixo",
      coletasValidas: 39,
      meta: 8,
      limiteAceitavel: 12,
      observacao: null,
      vars: {
        V11: { label: "Denúncias de nepotismo", data: { "2023": [2, 2, 2], "2024": [2, 2, 2], "2025": [2, 2, 1], "2026": [1, 1, null] } },
        V02: { label: "Total de denúncias", data: { "2023": [15, 18, 20], "2024": [22, 19, 24], "2025": [20, 23, 21], "2026": [18, 16, null] } },
      },
    },
    I08: {
      name: "Percentual de denúncias sobre conflito de interesse",
      formula: "(V12 / V02) × 100",
      periodicidade: "Quadrimestral",
      granularidade: "Mensal, com consolidação quadrimestral",
      sentidoBom: "baixo",
      coletasValidas: 39,
      meta: 12,
      limiteAceitavel: 18,
      observacao: null,
      vars: {
        V12: { label: "Denúncias de conflito de interesses", data: { "2023": [3, 4, 4], "2024": [4, 3, 4], "2025": [3, 3, 2], "2026": [2, 1, null] } },
        V02: { label: "Total de denúncias", data: { "2023": [15, 18, 20], "2024": [22, 19, 24], "2025": [20, 23, 21], "2026": [18, 16, null] } },
      },
    },
    I09: {
      name: "Percentual de procedência de denúncias",
      formula: "(V13 / V02 anual) × 100",
      periodicidade: "Anual",
      granularidade: "Anual",
      sentidoBom: "alto",
      coletasValidas: 3,
      meta: null,
      limiteAceitavel: null,
      observacao: "Observação I09",
      externalDenominator: "I01.V02",
      vars: {
        V13: { label: "Denúncias procedentes", data: { "2023": 24, "2024": 44, "2025": 53, "2026": null } },
      },
    },
    I10: {
      name: "Percentual de PAD com penalidade",
      formula: "(V14 / V15) × 100",
      periodicidade: "Anual",
      granularidade: "Anual",
      sentidoBom: "alto",
      coletasValidas: 3,
      meta: null,
      limiteAceitavel: null,
      observacao: null,
      vars: {
        V14: { label: "Denúncias com penalidade", data: { "2023": 11, "2024": 28, "2025": 47, "2026": null } },
        V15: { label: "Denúncias enviadas", data: { "2023": 30, "2024": 45, "2025": 55, "2026": null } },
      },
    },
  };
  const quadStatus = {
    "2023": ["completo", "completo", "completo"],
    "2024": ["completo", "completo", "completo"],
    "2025": ["completo", "completo", "completo"],
    "2026": ["completo", "parcial", "pendente"],
  };
  const anualStatus = {
    "2023": "completo",
    "2024": "completo",
    "2025": "completo",
    "2026": "pendente",
  };
  const integrityPairs = {
    I01: ["V01", "V02"], I02: ["V03", "V02"], I03: ["V04", "V02"],
    I04: ["V06", "V05"], I05: ["V07", "V08"], I06: ["V09", "V10"],
    I07: ["V11", "V02"], I08: ["V12", "V02"], I09: ["V13", "V02"],
    I10: ["V14", "V15"],
  };
  const yearColors = {
    "2023": "#8FC7EC",
    "2024": "#0026FF",
    "2025": "#A8C3FF",
    "2026": "#04007D",
  };
  return { YEARS, dashboardData, quadStatus, anualStatus, integrityPairs, yearColors };
}

function loadModelFunctions() {
  const mock = createMockData();
  const code = fs.readFileSync(path.resolve(__dirname, "../model.js"), "utf-8");

  const cleaned = code
    .replace(/^let (YEARS|quadStatus|anualStatus|dashboardData|integrityPairs|yearColors);\s*$/gm, "");

  const factory = new Function(
    "YEARS", "quadStatus", "anualStatus", "dashboardData", "integrityPairs", "yearColors",
    `
      ${cleaned}
      return {
        round1: typeof round1 !== "undefined" ? round1 : undefined,
        isAnual: typeof isAnual !== "undefined" ? isAnual : undefined,
        capitalize: typeof capitalize !== "undefined" ? capitalize : undefined,
        buildSeries: typeof buildSeries !== "undefined" ? buildSeries : undefined,
        validateIndicator: typeof validateIndicator !== "undefined" ? validateIndicator : undefined,
        computeKpis: typeof computeKpis !== "undefined" ? computeKpis : undefined,
        getLatestVarSnapshot: typeof getLatestVarSnapshot !== "undefined" ? getLatestVarSnapshot : undefined,
        getBarWidth: typeof getBarWidth !== "undefined" ? getBarWidth : undefined,
        initModel: typeof initModel !== "undefined" ? initModel : undefined,
        formulas: typeof formulas !== "undefined" ? formulas : undefined,
        ICONS: typeof ICONS !== "undefined" ? ICONS : undefined,
        get currentIndicator() { return typeof currentIndicator !== "undefined" ? currentIndicator : undefined; },
        set currentIndicator(v) { if (typeof currentIndicator !== "undefined") currentIndicator = v; },
        toolbarState: typeof toolbarState !== "undefined" ? toolbarState : undefined,
        varColor: typeof varColor !== "undefined" ? varColor : undefined,
      };
    `
  );

  return factory(
    mock.YEARS, mock.quadStatus, mock.anualStatus,
    mock.dashboardData, mock.integrityPairs, mock.yearColors
  );
}

module.exports = { createMockData, loadModelFunctions };
