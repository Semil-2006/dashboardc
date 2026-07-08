import json


class TestRoutes:
    def test_index_returns_html(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.content_type.startswith("text/html")
        assert b"Dashboard de Integridade" in resp.data

    def test_api_data_returns_json(self, client):
        resp = client.get("/api/data")
        assert resp.status_code == 200
        assert resp.content_type == "application/json"
        data = json.loads(resp.data)

        assert "YEARS" in data
        assert "dashboardData" in data
        assert "quadStatus" in data
        assert "anualStatus" in data
        assert "integrityPairs" in data
        assert "yearColors" in data

        assert data["YEARS"] == ["2023", "2024", "2025", "2026"]
        assert len(data["dashboardData"]) == 10
        assert len(data["quadStatus"]["2026"]) == 3
        for s in data["quadStatus"]["2026"]:
            assert s in ("completo", "parcial", "pendente")

    def test_api_data_indicators(self, client):
        resp = client.get("/api/data")
        data = json.loads(resp.data)
        dd = data["dashboardData"]

        for code in [f"I{str(i).zfill(2)}" for i in range(1, 11)]:
            assert code in dd
            assert "name" in dd[code]
            assert "formula" in dd[code]
            assert "vars" in dd[code]

    def test_api_data_year_colors(self, client):
        resp = client.get("/api/data")
        data = json.loads(resp.data)
        colors = data["yearColors"]
        for year in data["YEARS"]:
            assert year in colors
            assert isinstance(colors[year], str)

    def test_404(self, client):
        resp = client.get("/nonexistent")
        assert resp.status_code == 404
