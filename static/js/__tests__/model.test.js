const { createMockData } = require("./helpers");

let model;

beforeAll(async () => {
  const mock = createMockData();

  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mock),
    })
  );

  delete require.cache[require.resolve("../model.js")];
  model = require("../model.js");

  await model.initModel();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("round1", () => {
  test("rounds to one decimal place", () => {
    expect(model.round1(3.14159)).toBe(3.1);
  });

  test("handles integers", () => {
    expect(model.round1(5)).toBe(5);
  });

  test("handles zero", () => {
    expect(model.round1(0)).toBe(0);
  });

  test("rounds up correctly", () => {
    expect(model.round1(2.56)).toBe(2.6);
  });

  test("handles negative numbers", () => {
    expect(model.round1(-1.55)).toBe(-1.5);
  });
});

describe("capitalize", () => {
  test("capitalizes first letter", () => {
    expect(model.capitalize("hello")).toBe("Hello");
  });

  test("handles empty string", () => {
    expect(model.capitalize("")).toBe("");
  });

  test("handles single character", () => {
    expect(model.capitalize("a")).toBe("A");
  });

  test("handles null/undefined", () => {
    expect(model.capitalize(undefined)).toBe(undefined);
  });

  test("does not change already capitalized word", () => {
    expect(model.capitalize("Hello")).toBe("Hello");
  });
});

describe("isAnual", () => {
  test("returns true for annual indicators", () => {
    expect(model.isAnual("I04")).toBe(true);
    expect(model.isAnual("I05")).toBe(true);
    expect(model.isAnual("I09")).toBe(true);
  });

  test("returns false for quadrimestral indicators", () => {
    expect(model.isAnual("I01")).toBe(false);
    expect(model.isAnual("I02")).toBe(false);
    expect(model.isAnual("I03")).toBe(false);
  });
});

describe("getBarWidth", () => {
  test("returns correct widths for 1-4 years", () => {
    expect(model.getBarWidth(1)).toBe(44);
    expect(model.getBarWidth(2)).toBe(30);
    expect(model.getBarWidth(3)).toBe(22);
    expect(model.getBarWidth(4)).toBe(16);
  });

  test("returns 16 for counts > 4", () => {
    expect(model.getBarWidth(5)).toBe(16);
    expect(model.getBarWidth(10)).toBe(16);
  });

  test("returns 16 for count 0", () => {
    expect(model.getBarWidth(0)).toBe(16);
  });
});

describe("buildSeries - quadrimestral (I01)", () => {
  test("computes series correctly", () => {
    const series = model.buildSeries("I01");
    expect(series).toHaveProperty("2023");
    expect(series).toHaveProperty("2024");
    expect(series).toHaveProperty("2025");
    expect(series).toHaveProperty("2026");

    expect(series["2023"]).toEqual([40, 38.9, 35]);
    expect(series["2024"]).toEqual([31.8, 31.6, 29.2]);
    expect(series["2025"]).toEqual([25, 21.7, 19]);
  });

  test("returns null for periods with missing data", () => {
    const series = model.buildSeries("I01");
    expect(series["2026"][2]).toBeNull();
  });
});

describe("buildSeries - anual (I04)", () => {
  test("computes annual series correctly", () => {
    const series = model.buildSeries("I04");
    expect(series["2023"]).toBe(65);
    expect(series["2024"]).toBe(81.8);
    expect(series["2025"]).toBe(96.7);
  });

  test("returns null for year with missing data", () => {
    const series = model.buildSeries("I04");
    expect(series["2026"]).toBeNull();
  });
});

describe("buildSeries - I09 (special)", () => {
  test("uses external denominator from I01.V02", () => {
    const series = model.buildSeries("I09");
    expect(series["2023"]).toBeCloseTo(45.3, 1);
    expect(series["2024"]).toBeCloseTo(67.7, 1);
    expect(series["2025"]).toBeCloseTo(82.8, 1);
  });

  test("returns null for year with missing I01.V02 data", () => {
    const series = model.buildSeries("I09");
    expect(series["2026"]).toBeNull();
  });
});

describe("validateIndicator", () => {
  test("returns 0 violations for valid data", () => {
    expect(model.validateIndicator("I04")).toBe(0);
    expect(model.validateIndicator("I05")).toBe(0);
    expect(model.validateIndicator("I07")).toBe(0);
  });

  test("returns non-negative integer", () => {
    const v = model.validateIndicator("I01");
    expect(typeof v).toBe("number");
    expect(v).toBeGreaterThanOrEqual(0);
  });
});

describe("computeKpis", () => {
  const series = {
    "2023": [20, 25, 30],
    "2024": [35, 40, 45],
    "2025": [50, 55, 60],
  };

  test("computes latest value", () => {
    const k = model.computeKpis(series, ["2023", "2024", "2025"], false);
    expect(k.latestValue).toBe(60);
    expect(k.latestYear).toBe("2025");
  });

  test("computes average", () => {
    const k = model.computeKpis(series, ["2023", "2024", "2025"], false);
    expect(k.avg).toBeCloseTo(40, 0);
  });

  test("computes max and min", () => {
    const k = model.computeKpis(series, ["2023", "2024", "2025"], false);
    expect(k.max).toBe(60);
    expect(k.min).toBe(20);
  });

  test("handles series with all null values", () => {
    const allNull = { "2023": [null, null, null] };
    const k = model.computeKpis(allNull, ["2023"], false);
    expect(k.latestValue).toBeNull();
    expect(k.avg).toBeNull();
    expect(k.max).toBeNull();
    expect(k.min).toBeNull();
    expect(k.delta).toBeNull();
  });

  test("handles annual series", () => {
    const anualSeries = { "2023": 50, "2024": 60, "2025": 70 };
    const k = model.computeKpis(anualSeries, ["2023", "2024", "2025"], true);
    expect(k.latestValue).toBe(70);
    expect(k.avg).toBe(60);
    expect(k.min).toBe(50);
    expect(k.max).toBe(70);
  });

  test("annual delta with previous year", () => {
    const s = { "2023": 50, "2024": 60, "2025": 70 };
    const k = model.computeKpis(s, ["2023", "2024", "2025"], true);
    expect(k.delta).toBe(10);
  });

  test("annual delta null with single year", () => {
    const s = { "2023": 50 };
    const k = model.computeKpis(s, ["2023"], true);
    expect(k.delta).toBeNull();
  });

  test("annual delta null when first year has value", () => {
    const s = { "2023": 50, "2024": null };
    const k = model.computeKpis(s, ["2023", "2024"], true);
    expect(k.delta).toBeNull();
  });

  test("annual latest from multiple years", () => {
    const s = { "2023": null, "2024": 60, "2025": null };
    const k = model.computeKpis(s, ["2023", "2024", "2025"], true);
    expect(k.latestValue).toBe(60);
    expect(k.latestYear).toBe("2024");
  });

  test("computes delta for quadrimestral", () => {
    const src = { "2023": [10, 20, 30], "2024": [40, 50, 60] };
    const k = model.computeKpis(src, ["2023", "2024"], false);
    expect(k.delta).toBe(10);
  });

  test("delta computed from previous period in same year", () => {
    const src = { "2023": [10, 20, 30] };
    const k = model.computeKpis(src, ["2023"], false);
    expect(k.delta).toBe(10);
  });

  test("handles null values in series", () => {
    const src = { "2023": [10, null, 30], "2024": [40, 50, null] };
    const k = model.computeKpis(src, ["2023", "2024"], false);
    expect(k.latestValue).toBe(50);
    expect(typeof k.avg).toBe("number");
  });
});

describe("validateIndicator edge cases", () => {
  test("I09 handles special denominator check", () => {
    expect(typeof model.validateIndicator("I09")).toBe("number");
  });
});

describe("getLatestVarSnapshot", () => {
  test("returns variables for quadrimestral indicator", () => {
    const rows = model.getLatestVarSnapshot("I01");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("code");
    expect(rows[0]).toHaveProperty("label");
    expect(rows[0]).toHaveProperty("value");
    expect(rows[0]).toHaveProperty("year");
  });

  test("returns most recent complete period for quadrimestral", () => {
    const rows = model.getLatestVarSnapshot("I01");
    expect(rows[0].year).toBe("2026");
    expect(rows[0].period).toBe(1);
  });

  test("returns variables for annual indicator", () => {
    const rows = model.getLatestVarSnapshot("I04");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].period).toBeNull();
  });

  test("includes V02 aggregation for I09", () => {
    const rows = model.getLatestVarSnapshot("I09");
    const v02row = rows.find(r => r.code === "V02");
    expect(v02row).toBeDefined();
  });
});

describe("ICONS", () => {
  test("has required icons", () => {
    expect(model.ICONS).toHaveProperty("filter");
    expect(model.ICONS).toHaveProperty("expand");
    expect(model.ICONS).toHaveProperty("more");
    expect(model.ICONS).toHaveProperty("exportIcon");
    expect(model.ICONS).toHaveProperty("table");
    expect(model.ICONS).toHaveProperty("remove");
    expect(model.ICONS).toHaveProperty("highlight");
    expect(model.ICONS).toHaveProperty("sortDesc");
    expect(model.ICONS).toHaveProperty("sortAsc");
    expect(model.ICONS).toHaveProperty("sortBy");
    expect(model.ICONS).toHaveProperty("calc");
    expect(model.ICONS).toHaveProperty("check");
  });

  test("icons are SVG strings", () => {
    Object.values(model.ICONS).forEach(icon => {
      expect(icon).toContain("<svg");
      expect(icon).toContain("</svg>");
    });
  });
});

describe("initModel", () => {
  test("populates data from fetch", () => {
    expect(model.dashboardData).toBeDefined();
    expect(Object.keys(model.dashboardData).length).toBe(10);
    expect(model.YEARS).toEqual(["2023", "2024", "2025", "2026"]);
  });
});
