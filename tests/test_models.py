from app.models.models import (
    YEARS, dashboardData, quadStatus, anualStatus,
    integrityPairs, yearColors, formulas
)


class TestConstants:
    def test_years(self):
        assert YEARS == ["2023", "2024", "2025", "2026"]

    def test_quad_status_structure(self):
        for year in YEARS:
            assert year in quadStatus
            assert len(quadStatus[year]) == 3
            for s in quadStatus[year]:
                assert s in ("completo", "parcial", "pendente")

    def test_anual_status_structure(self):
        for year in YEARS:
            assert year in anualStatus
            assert anualStatus[year] in ("completo", "parcial", "pendente")

    def test_year_colors(self):
        assert yearColors["2023"] == "#8FC7EC"
        assert yearColors["2024"] == "#0026FF"
        assert yearColors["2025"] == "#A8C3FF"
        assert yearColors["2026"] == "#04007D"


class TestDashboardData:
    def test_all_indicators_present(self):
        expected = [f"I{str(i).zfill(2)}" for i in range(1, 11)]
        for code in expected:
            assert code in dashboardData

    def test_indicator_structure(self):
        for code, ind in dashboardData.items():
            assert "name" in ind
            assert "formula" in ind
            assert "periodicidade" in ind
            assert "granularidade" in ind
            assert "sentidoBom" in ind
            assert "coletasValidas" in ind
            assert "vars" in ind
            assert ind["sentidoBom"] in ("alto", "baixo")

    def test_periodicidade(self):
        quad = {"I01", "I02", "I03", "I07", "I08"}
        anual = {"I04", "I05", "I06", "I09", "I10"}
        for code in quad:
            assert dashboardData[code]["periodicidade"] == "Quadrimestral"
        for code in anual:
            assert dashboardData[code]["periodicidade"] == "Anual"

    def test_vars_structure_quadrimestral(self):
        quad_codes = ["I01", "I02", "I03", "I07", "I08"]
        for code in quad_codes:
            ind = dashboardData[code]
            for vc, v in ind["vars"].items():
                assert "label" in v
                assert "data" in v
                for year in YEARS:
                    assert year in v["data"]
                    vals = v["data"][year]
                    assert isinstance(vals, list)
                    assert len(vals) == 3

    def test_vars_structure_anual(self):
        anual_codes = ["I04", "I05", "I06", "I09", "I10"]
        for code in anual_codes:
            ind = dashboardData[code]
            for vc, v in ind["vars"].items():
                for year in YEARS:
                    assert year in v["data"]
                    val = v["data"][year]

    def test_i09_external_denominator(self):
        assert dashboardData["I09"]["externalDenominator"] == "I01.V02"

    def test_coletas_validas(self):
        for code, ind in dashboardData.items():
            assert isinstance(ind["coletasValidas"], int)
            assert ind["coletasValidas"] > 0


class TestIntegrityPairs:
    def test_all_codes_present(self):
        for code in dashboardData:
            assert code in integrityPairs

    def test_pair_structure(self):
        for code, pair in integrityPairs.items():
            assert isinstance(pair, list)
            assert len(pair) == 2

    def test_i09_uses_v02(self):
        assert integrityPairs["I09"] == ["V13", "V02"]


class TestFormulas:
    def test_all_codes_present(self):
        for code in dashboardData:
            assert code in formulas

    def test_i01_formula(self):
        assert formulas["I01"] == "(V01 / V02) * 100"

    def test_i04_formula(self):
        assert formulas["I04"] == "(V06 / V05) * 100"

    def test_i09_formula(self):
        assert formulas["I09"] == "(V13 / V02) * 100"

    def test_i10_formula(self):
        assert formulas["I10"] == "(V14 / V15) * 100"


class TestDataIntegrity:
    def test_all_vars_referenced_in_formulas(self):
        for code in dashboardData:
            formula = formulas[code]
            ind = dashboardData[code]
            for vc in ind["vars"]:
                assert vc in formula, f"{vc} not found in formula for {code}"

    def test_no_negative_values(self):
        for code, ind in dashboardData.items():
            for vc, v in ind["vars"].items():
                for year in YEARS:
                    vals = v["data"][year]
                    if isinstance(vals, list):
                        for val in vals:
                            if val is not None:
                                assert val >= 0, f"Negative value in {code}.{vc}[{year}]"
                    else:
                        if vals is not None:
                            assert vals >= 0, f"Negative value in {code}.{vc}[{year}]"

    def test_meta_limits_consistency(self):
        for code, ind in dashboardData.items():
            if ind["meta"] is not None:
                assert ind["limiteAceitavel"] is not None
                if ind["sentidoBom"] == "baixo":
                    assert ind["meta"] <= ind["limiteAceitavel"], \
                        f"{code}: meta should be <= limiteAceitavel for sentidoBom=baixo"
                else:
                    assert ind["meta"] >= ind["limiteAceitavel"], \
                        f"{code}: meta should be >= limiteAceitavel for sentidoBom=alto"
