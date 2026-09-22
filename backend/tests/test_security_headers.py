"""CSRF + cabeceras de seguridad + X-Request-ID (sin DB real)."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_mutacion_sin_cabecera_csrf_bloqueada():
    r = client.post("/api/v1/contact/messages", json={
        "name": "X", "email": "x@x.com", "phone": None, "message": "hola mundo largo",
    })
    assert r.status_code == 403
    assert "X-Requested-With" in r.json()["detail"]


def test_login_exento_de_csrf_pero_con_throttle():
    # Sin cabecera debe pasar el middleware (el throttle/DB decide después).
    r = client.post("/api/v1/auth/login", json={"username": "nadie", "password": "x" * 8})
    assert r.status_code in (401, 429, 500)


def test_security_headers_y_request_id():
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert r.headers.get("X-Frame-Options") == "DENY"
    assert "X-Request-ID" in r.headers
    # Request-ID malicioso no se refleja tal cual
    r2 = client.get("/healthz", headers={"X-Request-ID": "malo\r\ninjected: 1"})
    assert "\r" not in r2.headers.get("X-Request-ID", "")
    assert "\n" not in r2.headers.get("X-Request-ID", "")
