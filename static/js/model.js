let YEARS;
let quadStatus;
let anualStatus;
let dashboardData;
let integrityPairs;
let yearColors;

const varColor = "var(--navy)";
let currentIndicator = "I01";
const toolbarState = {};

const formulas = {
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

const ICONS = {
    filter: `<svg viewBox="0 0 24 24"><path d="M4 5h16l-6 8v6l-4-2v-4L4 5z"/></svg>`,
    expand: `<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
    more: `<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/></svg>`,
    exportIcon: `<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>`,
    table: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M9 4v16"/></svg>`,
    remove: `<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>`,
    highlight: `<svg viewBox="0 0 24 24"><path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z"/></svg>`,
    sortDesc: `<svg viewBox="0 0 24 24"><path d="M4 6h10M4 12h7M4 18h4M17 4v16M17 20l4-4M17 20l-4-4"/></svg>`,
    sortAsc: `<svg viewBox="0 0 24 24"><path d="M4 18h10M4 12h7M4 6h4M17 20V4M17 4l4 4M17 4l-4 4"/></svg>`,
    sortBy: `<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h10M4 17h6"/></svg>`,
    calc: `<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h2M13 12h3M8 16h2M13 16h3"/></svg>`,
    check: `<svg viewBox="0 0 24 24" style="stroke:var(--accent)"><path d="M20 6L9 17l-5-5"/></svg>`
};

async function initModel() {
    const resp = await fetch("/api/data");
    const data = await resp.json();
    YEARS = data.YEARS;
    dashboardData = data.dashboardData;
    quadStatus = data.quadStatus;
    anualStatus = data.anualStatus;
    integrityPairs = data.integrityPairs;
    yearColors = data.yearColors;
}

function round1(n) { return Math.round(n * 10) / 10; }
function isAnual(code) { return dashboardData[code].periodicidade === "Anual"; }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function buildSeries(code) {
    const ind = dashboardData[code];
    const series = {};

    if (isAnual(code)) {
        YEARS.forEach(year => {
            if (code === "I09") {
                const v02arr = dashboardData.I01.vars.V02.data[year];
                const v13 = ind.vars.V13.data[year];
                const denomOk = v02arr && v02arr.every(x => x !== null);
                series[year] = (denomOk && v13 !== null && v13 !== undefined)
                    ? round1((v13 / v02arr.reduce((a, b) => a + b, 0)) * 100)
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
            series[year] = complete ? round1(formulas[code](varsForYear)) : null;
        });
    } else {
        YEARS.forEach(year => {
            series[year] = [0, 1, 2].map(i => {
                const varsForPeriod = {};
                let complete = true;
                Object.keys(ind.vars).forEach(vc => {
                    const val = ind.vars[vc].data[year][i];
                    if (val === null || val === undefined) complete = false;
                    varsForPeriod[vc] = val;
                });
                return complete ? round1(formulas[code](varsForPeriod)) : null;
            });
        });
    }
    return series;
}

function validateIndicator(code) {
    const ind = dashboardData[code];
    const [numCode, denCode] = integrityPairs[code];
    let violations = 0;

    YEARS.forEach(year => {
        if (isAnual(code)) {
            if (code === "I09") {
                const numVal = ind.vars.V13.data[year];
                if (numVal !== null && numVal < 0) violations++;
                return;
            }
            const numVal = ind.vars[numCode].data[year];
            const denVal = ind.vars[denCode].data[year];
            if (numVal === null || denVal === null) return;
            if (numVal < 0 || denVal < 0) violations++;
            if (numVal > denVal) violations++;
        } else {
            for (let i = 0; i < 3; i++) {
                const numVal = ind.vars[numCode].data[year][i];
                const denVal = ind.vars[denCode].data[year][i];
                if (numVal === null || denVal === null) continue;
                if (numVal < 0 || denVal < 0) violations++;
                if (numVal > denVal) violations++;
            }
        }
    });
    return violations;
}

function computeKpis(series, selectedYears, anual) {
    const allValues = [];
    selectedYears.forEach(y => {
        if (anual) {
            if (series[y] !== null) allValues.push(series[y]);
        } else {
            series[y].forEach(v => { if (v !== null) allValues.push(v); });
        }
    });

    let latestYear = null, latestValue = null, prevValue = null;
    for (let i = selectedYears.length - 1; i >= 0 && latestValue === null; i--) {
        const y = selectedYears[i];
        if (anual) {
            if (series[y] !== null) { latestYear = y; latestValue = series[y]; }
        } else {
            for (let p = 2; p >= 0; p--) {
                if (series[y][p] !== null) { latestYear = y; latestValue = series[y][p]; break; }
            }
        }
    }

    if (latestValue !== null && !anual) {
        const yIdx = selectedYears.indexOf(latestYear);
        const periodIdx = series[latestYear].lastIndexOf(latestValue);
        if (periodIdx > 0 && series[latestYear][periodIdx - 1] !== null) {
            prevValue = series[latestYear][periodIdx - 1];
        } else if (yIdx > 0) {
            const prevYear = selectedYears[yIdx - 1];
            const prevArr = series[prevYear].filter(v => v !== null);
            if (prevArr.length) prevValue = prevArr[prevArr.length - 1];
        }
    } else if (latestValue !== null && anual) {
        const yIdx = selectedYears.indexOf(latestYear);
        if (yIdx > 0) {
            for (let i = yIdx - 1; i >= 0; i--) {
                if (series[selectedYears[i]] !== null) { prevValue = series[selectedYears[i]]; break; }
            }
        }
    }

    const avg = allValues.length ? allValues.reduce((a, b) => a + b, 0) / allValues.length : null;
    const max = allValues.length ? Math.max(...allValues) : null;
    const min = allValues.length ? Math.min(...allValues) : null;
    const delta = (latestValue !== null && prevValue !== null) ? round1(latestValue - prevValue) : null;

    return { latestYear, latestValue, delta, avg, max, min };
}

function getLatestVarSnapshot(code) {
    const ind = dashboardData[code];
    const rows = [];

    if (isAnual(code)) {
        for (let i = YEARS.length - 1; i >= 0; i--) {
            const year = YEARS[i];
            const allPresent = Object.keys(ind.vars).every(vc => ind.vars[vc].data[year] !== null);
            if (allPresent || code === "I09") {
                Object.keys(ind.vars).forEach(vc => {
                    const val = ind.vars[vc].data[year];
                    if (val !== null && val !== undefined) rows.push({ code: vc, label: ind.vars[vc].label, value: val, year, period: null });
                });
                if (code === "I09") {
                    const v02arr = dashboardData.I01.vars.V02.data[year];
                    if (v02arr && v02arr.every(x => x !== null)) {
                        rows.push({ code: "V02", label: "Total de denúncias (ano, agregado)", value: v02arr.reduce((a, b) => a + b, 0), year, period: null });
                    }
                }
                if (rows.length) return rows;
            }
        }
        return rows;
    }

    for (let i = YEARS.length - 1; i >= 0; i--) {
        const year = YEARS[i];
        for (let p = 2; p >= 0; p--) {
            const allPresent = Object.keys(ind.vars).every(vc => ind.vars[vc].data[year][p] !== null);
            if (allPresent) {
                Object.keys(ind.vars).forEach(vc => {
                    rows.push({ code: vc, label: ind.vars[vc].label, value: ind.vars[vc].data[year][p], year, period: p });
                });
                return rows;
            }
        }
    }
    return rows;
}

function getSelectedYears() {
    return [...document.querySelectorAll(".year-checkbox:checked")].map(cb => cb.value);
}

function getBarWidth(count) {
    const widths = { 1: 44, 2: 30, 3: 22, 4: 16 };
    return widths[count] || 16;
}
