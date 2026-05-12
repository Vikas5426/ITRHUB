from app.services.tax_engine import calculate_tax, compare_regimes


def test_calculate_tax_basic_old_new():
    res_old = calculate_tax(500_000, deductions=0, regime="old")
    res_new = calculate_tax(500_000, deductions=0, regime="new")

    assert res_old["taxable_income"] == 500000
    assert res_new["taxable_income"] == 500000
    assert "breakdown" in res_old and "breakdown" in res_new


def test_compare_regimes_produces_both():
    comp = compare_regimes(1_000_000, deductions=100_000)
    assert "old" in comp and "new" in comp
