from app import create_app


class TestAppFactory:
    def test_create_app(self):
        app = create_app()
        assert app is not None
        assert app.template_folder.endswith("templates")
        assert app.static_folder.endswith("static")

    def test_app_routes_registered(self, app):
        rules = [rule.endpoint for rule in app.url_map.iter_rules()]
        assert "main.index" in rules
        assert "main.api_data" in rules
