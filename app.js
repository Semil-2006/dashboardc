const dashboardData = {
    I01: {
        name: "Percentual de denúncias de assédio moral",
        formula: "(V01 / V02) × 100",
        data: {
            2023: [80, 65, 50, 30],
            2024: [40, 70, 60, 45],
            2025: [90, 85, 55, 35],
            2026: [60, 50, 75, 20]
        },
        vars: [180, 120, 90]
    },

    I02: {
        name: "Percentual de denúncias de assédio sexual",
        formula: "(V03 / V02) × 100",
        data: {
            2023: [15, 22, 30, 12],
            2024: [18, 40, 22, 15],
            2025: [25, 10, 18, 8],
            2026: [35, 30, 20, 15]
        },
        vars: [80, 100, 70]
    },

    I03: {
        name: "Efetividade de apuração de denúncias",
        formula: "(V04 / V02) × 100",
        data: {
            2023: [70, 72, 74, 76],
            2024: [77, 80, 79, 82],
            2025: [81, 83, 84, 85],
            2026: [88, 90, 92, 95]
        },
        vars: [220, 180, 150]
    },

    I04: {
        name: "Atendimento da Lei 6112/2018",
        formula: "(V05 / V06) × 100",
        data: {
            2023: [30, 40, 50, 60],
            2024: [60, 65, 70, 80],
            2025: [75, 82, 90, 95],
            2026: [100, 95, 98, 100]
        },
        vars: [200, 160, 110]
    },

    I05: {
        name: "Percentual de empregados treinados",
        formula: "(V07 / V08) × 100",
        data: {
            2023: [20, 35, 50, 60],
            2024: [55, 62, 68, 75],
            2025: [78, 82, 85, 90],
            2026: [92, 95, 97, 99]
        },
        vars: [250, 200, 180]
    },

    I06: {
        name: "Percentual de evasão em compliance",
        formula: "(V09 / V10) × 100",
        data: {
            2023: [10, 20, 25, 12],
            2024: [15, 22, 18, 10],
            2025: [8, 12, 16, 20],
            2026: [5, 6, 10, 8]
        },
        vars: [70, 120, 80]
    },

    I07: {
        name: "Denúncias de nepotismo",
        formula: "(V11 / V02) × 100",
        data: {
            2023: [5, 8, 12, 10],
            2024: [15, 10, 18, 12],
            2025: [8, 6, 5, 10],
            2026: [3, 4, 2, 1]
        },
        vars: [40, 30, 20]
    },

    I08: {
        name: "Conflito de interesse",
        formula: "(V12 / V02) × 100",
        data: {
            2023: [10, 14, 16, 18],
            2024: [12, 15, 20, 22],
            2025: [25, 22, 18, 14],
            2026: [8, 6, 5, 4]
        },
        vars: [90, 110, 130]
    },

    I09: {
        name: "Procedência de denúncias",
        formula: "(V13 / V02) × 100",
        data: {
            2023: [40, 45, 55, 65],
            2024: [60, 65, 68, 72],
            2025: [70, 75, 80, 82],
            2026: [85, 88, 92, 95]
        },
        vars: [150, 180, 200]
    },

    I10: {
        name: "Processos com penalidade",
        formula: "(V14 / V15) × 100",
        data: {
            2023: [25, 35, 42, 48],
            2024: [52, 60, 64, 70],
            2025: [72, 76, 82, 88],
            2026: [90, 92, 95, 100]
        },
        vars: [170, 150, 130]
    }
};

const yearColors = {
    2023: "#4b7be5",
    2024: "#2ecc71",
    2025: "#f39c12",
    2026: "#e74c3c"
};

let currentIndicator = "I01";

const title = document.getElementById("reportTitle");
const indicatorName = document.getElementById("indicatorName");
const formula = document.getElementById("formula");
const chart = document.getElementById("mainChart");

const vars = [
    document.getElementById("v1"),
    document.getElementById("v2"),
    document.getElementById("v3")
];

function getSelectedYears() {
    return [...document.querySelectorAll(".year-checkbox:checked")]
        .map(cb => cb.value);
}

function renderDashboard(indicatorCode) {
    const selectedYears = getSelectedYears();
    const data = dashboardData[indicatorCode];

    title.textContent = `Relatorio ${indicatorCode}`;
    indicatorName.textContent = data.name;
    formula.textContent = `Fórmula: ${data.formula}`;

    chart.innerHTML = "";

    if (selectedYears.length === 0) {
        chart.innerHTML = "<h2>Selecione pelo menos 1 ano</h2>";
        return;
    }

    for (let quarter = 0; quarter < 4; quarter++) {
        const group = document.createElement("div");
        group.className = "quarter-group";

        selectedYears.forEach(year => {
            const value = data.data[year][quarter];

            const bar = document.createElement("div");
            bar.className = "dynamic-bar";
            bar.style.height = `${value * 2.5}px`;
            bar.style.background = yearColors[year];
            bar.title = `${year} | Q${quarter + 1}: ${value}`;

            group.appendChild(bar);
        });

        const label = document.createElement("div");
        label.className = "quarter-label";
        label.textContent = `Q${quarter + 1}`;

        group.appendChild(label);
        chart.appendChild(group);
    }

    data.vars.forEach((value, index) => {
        vars[index].style.width = `${value}px`;
    });
}

document.querySelectorAll(".report-btn").forEach(btn => {
    btn.addEventListener("click", function () {
        document.querySelectorAll(".report-btn").forEach(b => {
            b.classList.remove("active");
        });

        this.classList.add("active");
        currentIndicator = this.dataset.report;
        renderDashboard(currentIndicator);
    });
});

document.querySelectorAll(".year-checkbox").forEach(box => {
    box.addEventListener("change", () => {
        renderDashboard(currentIndicator);
    });
});

renderDashboard("I01");