from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_portfolio_analyze_with_user_id_returns_tax_summary():
    csv = """Asset Name,Asset Type,Buy Date,Sell Date,Buy Price,Sell Price,Quantity
Test Equity,Listed Equity,2020-01-01,2024-01-02,100,300,1000
"""

    files = {"file": ("test.csv", csv, "text/csv")}
    data = {"user_id": "1", "regime": "old"}
    resp = client.post("/api/portfolio/analyze", files=files, data=data)
    assert resp.status_code == 200
    body = resp.json()
    assert "data" in body
    assert "special_tax_components" in body
    assert "tax_summary" in body
    assert isinstance(body["tax_summary"]["tax_after_cess"], (int, float))


def test_portfolio_analyze_with_user_id_2_and_missing_user():
    csv = """Asset Name,Asset Type,Buy Date,Sell Date,Buy Price,Sell Price,Quantity
Test Equity,Listed Equity,2020-01-01,2024-01-02,100,300,1000
"""
    files = {"file": ("test.csv", csv, "text/csv")}
    data = {"user_id": "2", "regime": "new"}
    resp = client.post("/api/portfolio/analyze", files=files, data=data)
    assert resp.status_code == 200
    body = resp.json()
    assert "tax_summary" in body

    # missing user_id and income -> strict validation returns 400
    resp2 = client.post("/api/portfolio/analyze", files=files)
    assert resp2.status_code == 400
