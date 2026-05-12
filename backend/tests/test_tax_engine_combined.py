import pytest

from app.services import portfolio_service, tax_engine


def test_combined_salary_business_and_gains():
    # Salary + business
    salary = 800_000
    business = 200_000
    income = salary + business
    deductions = 50_000

    # Single listed equity LTCG with gain 200_000 (exemption 125k applies)
    csv = """Asset Name,Asset Type,Buy Date,Sell Date,Buy Price,Sell Price,Quantity
Test Equity,Listed Equity,2020-01-01,2024-01-02,100,300,1000
"""

    items = portfolio_service.parse_and_calc(csv)
    # ensure we have one item and it's LTCG
    assert len(items) == 1
    assert items[0]["cat"] == "LTCG"

    # aggregate pre-cess LTCG from portfolio_service
    ltcg_pre = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "LTCG")

    # Now calculate tax: slab-tax computed from taxable slab income, special components included
    res = tax_engine.calculate_tax(income, deductions, regime="old", special_tax_components={"ltcg_tax": ltcg_pre})

    # Expected computations (manual):
    # Taxable income = 1_000_000 - 50_000 = 950_000
    # Slab tax (old): 0@0-250k, 5% on 250k = 12_500; 20% on 450k = 90_000 => 102_500
    # LTCG taxable after exemption: gain 200k - 125k = 75k -> LTCG tax pre-cess = 75k * 0.125 = 9_375
    # Total pre-cess = 102_500 + 9_375 = 111_875
    # Cess @4% = 4_475 -> total = 116_350

    assert res["tax_after_cess"] == pytest.approx(116350)
