var _riskConfig = typeof globalThis !== "undefined" && globalThis._riskConfig ? globalThis._riskConfig : (typeof window !== "undefined" && window._riskConfig ? window._riskConfig : null);
var _riskCache = null;

async function loadRiskConfig() {
  if (_riskConfig) return _riskConfig;
  const resp = await fetch("/static/risk-matrix/riskConfig.json");
  _riskConfig = await resp.json();
  if (typeof globalThis !== "undefined") globalThis._riskConfig = _riskConfig;
  if (typeof window !== "undefined") window._riskConfig = _riskConfig;
  return _riskConfig;
}

function _rc() {
  if (_riskConfig) return _riskConfig;
  if (typeof globalThis !== "undefined" && globalThis._riskConfig) return globalThis._riskConfig;
  if (typeof window !== "undefined" && window._riskConfig) return window._riskConfig;
  return null;
}

function getRiskConfig() {
  return _rc();
}

function getCausas() {
  const cfg = _rc();
  if (!cfg) return [];
  const causas = [];
  Object.keys(cfg.eventos).forEach(eventoId => {
    const evento = cfg.eventos[eventoId];
    evento.causas.forEach(c => {
      causas.push({ ...c, eventoNome: evento.nome, eventoId });
    });
  });
  return causas;
}

function computeTrend(series, anual) {
  const values = [];
  Object.keys(series).forEach(year => {
    if (anual) {
      if (series[year] !== null) values.push(series[year]);
    } else {
      series[year].forEach(v => { if (v !== null) values.push(v); });
    }
  });
  if (values.length < 2) return "\u2192";
  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);
  const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const diff = avg2 - avg1;
  const threshold = avg1 * 0.05;
  if (diff > threshold) return "\u2191";
  if (diff < -threshold) return "\u2193";
  return "\u2192";
}

function computeProbability(indicatorCode) {
  const cfg = _rc();
  if (!cfg || !dashboardData || !dashboardData[indicatorCode]) {
    return { nivel: 3, rotulo: "M\u00e9dia", detalhe: "Sem dados suficientes (fallback conservador)", trend: "\u2192" };
  }
  const ind = dashboardData[indicatorCode];
  const anual = isAnual(indicatorCode);
  const series = buildSeries(indicatorCode);
  const values = [];
  Object.keys(series).forEach(year => {
    if (anual) {
      if (series[year] !== null) values.push(series[year]);
    } else {
      series[year].forEach(v => { if (v !== null) values.push(v); });
    }
  });
  const threshold = cfg.thresholds.probabilidade;
  if (values.length < threshold.coletasMinimas) {
    return { nivel: 3, rotulo: "M\u00e9dia", detalhe: "Hist\u00f3rico insuficiente (" + values.length + "/" + threshold.coletasMinimas + " coletas) \u2014 classifica\u00e7\u00e3o conservadora", trend: "\u2192" };
  }
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const trend = computeTrend(series, anual);
  const trendUp = trend === "\u2191";
  const trendDown = trend === "\u2193";
  const bom = ind.sentidoBom;
  const meta = ind.meta;
  const limite = ind.limiteAceitavel;
  let nivel = 3;
  let detalhe = "";
  if (bom === "baixo") {
    if (meta !== null && avg <= meta) {
      nivel = trendDown ? 1 : 2;
      detalhe = "Valor (" + round1(avg) + "%) dentro da meta" + (trendDown ? ", tend\u00eancia de queda" : "");
    } else if (limite !== null && avg <= limite) {
      nivel = trendUp ? 3 : 2;
      detalhe = "Valor (" + round1(avg) + "%) na faixa aceit\u00e1vel" + (trendUp ? ", tend\u00eancia de alta" : "");
    } else {
      nivel = trendUp ? 5 : 4;
      detalhe = "Valor (" + round1(avg) + "%) acima do limite aceit\u00e1vel" + (trendUp ? ", tend\u00eancia de alta" : "");
    }
  } else {
    if (meta !== null && avg >= meta) {
      nivel = trendUp ? 1 : 2;
      detalhe = "Valor (" + round1(avg) + "%) dentro da meta" + (trendUp ? ", tend\u00eancia de alta" : "");
    } else if (limite !== null && avg >= limite) {
      nivel = trendDown ? 3 : 2;
      detalhe = "Valor (" + round1(avg) + "%) na faixa aceit\u00e1vel" + (trendDown ? ", tend\u00eancia de queda" : "");
    } else {
      nivel = trendDown ? 5 : 4;
      detalhe = "Valor (" + round1(avg) + "%) abaixo do limite aceit\u00e1vel" + (trendDown ? ", tend\u00eancia de queda" : "");
    }
  }
  const niveis = cfg.thresholds.probabilidade.niveis;
  const rotuloObj = niveis.find(n => n.nivel === nivel);
  const rotulo = rotuloObj ? rotuloObj.rotulo : "M\u00e9dia";
  return { nivel, rotulo, detalhe, trend };
}

function computeScore(probabilidade, impacto) {
  return probabilidade * impacto;
}

function classifyScore(score) {
  const cfg = _rc();
  if (!cfg) return { cor: "neutro", rotulo: "Indefinido" };
  const faixas = cfg.thresholds.score.faixas;
  for (const faixa of faixas) {
    if (score >= faixa.min && score <= faixa.max) {
      return { cor: faixa.cor, rotulo: faixa.rotulo };
    }
  }
  return { cor: "neutro", rotulo: "Indefinido" };
}

function computeAllRisks() {
  if (_riskCache) return _riskCache;
  const causas = getCausas();
  const results = causas.map(causa => {
    let probabilidade = null;
    let score = null;
    let classificacao = { cor: "neutro", rotulo: "Sem dado" };
    let trend = null;
    if (causa.indicador && dashboardData && dashboardData[causa.indicador]) {
      const probResult = computeProbability(causa.indicador);
      probabilidade = probResult;
      score = computeScore(probResult.nivel, causa.impacto);
      classificacao = classifyScore(score);
      trend = probResult.trend || null;
    } else {
      probabilidade = { nivel: null, rotulo: "N\u00e3o calcul\u00e1vel", detalhe: "Sem indicador implantado \u2014 probabilidade n\u00e3o definida", trend: null };
    }
    return { ...causa, probabilidade, score, classificacao, trend };
  });
  _riskCache = results;
  return results;
}

function clearRiskCache() {
  _riskCache = null;
}
