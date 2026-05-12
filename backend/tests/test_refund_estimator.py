from app.services.tax_engine import estimate_refund


def test_refund_estimator_overpaid():
    res = estimate_refund(500_000, 0, tds_paid=20000, regime="old")
    assert "refund" in res and "due" in res
