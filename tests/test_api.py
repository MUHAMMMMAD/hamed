"""اختبارات واجهة الـ API ولوحة الويب."""
from fastapi.testclient import TestClient

from masarat.api import app

client = TestClient(app)


def test_dashboard():
    r = client.get("/")
    assert r.status_code == 200
    assert "MASARAT" in r.text


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_providers():
    assert len(client.get("/providers").json()) == 8


def test_demo():
    j = client.get("/demo").json()
    assert j["cost"]["selling_price"] > 0
    assert j["decision"]["decision"] in {"BID", "NO_BID", "BID_WITH_CONDITIONS"}


def test_council():
    r = client.post("/council", json={"question": "اختبار", "providers": ["chatgpt"]})
    assert r.status_code == 200
    assert len(r.json()["responses"]) == 1


def test_templates():
    assert client.get("/templates/boq").status_code == 200
    assert client.get("/templates/prices").status_code == 200
