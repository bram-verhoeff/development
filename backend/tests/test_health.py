from fastapi.testclient import TestClient

from app.main import app


def test_health():
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_database_url_gets_psycopg_driver():
    from app.config import Settings

    for url in ("postgres://u:p@h:5432/db", "postgresql://u:p@h:5432/db"):
        assert Settings(_env_file=None, database_url=url).database_url == "postgresql+psycopg://u:p@h:5432/db"
    assert Settings(_env_file=None, database_url="sqlite:///./x.db").database_url == "sqlite:///./x.db"
