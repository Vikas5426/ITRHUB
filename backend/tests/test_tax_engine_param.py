import pytest

from app.services import tax_engine


def _generate_cases():
    cases = []
    step = 50_000
    max_income = 10_000_000
    incomes = list(range(0, max_income, step))  # 200 cases
    i = 0
    for income in incomes:
        deductions = (i % 6) * 25_000
        regime = "old" if (i % 2) == 0 else "new"
        cases.append((income, deductions, regime))
        i += 1
    return cases


@pytest.mark.parametrize("income,deductions,regime", _generate_cases())
def test_calculate_tax_properties(income, deductions, regime):
    res = tax_engine.calculate_tax(income, deductions, regime=regime)

    # Basic shape checks
    assert isinstance(res, dict)
    assert res["regime"] in ("old", "new")
    assert res["taxable_income"] >= 0
    assert res["tax_after_cess"] >= 0

    # surcharge rate matches internal mapping
    expected_surcharge = tax_engine._get_surcharge_rate(income)
    assert res["surcharge_rate"] == expected_surcharge

    # Adding special tax components must not reduce total tax
    special = {"stcg_tax": 10_000.0, "ltcg_tax": 5_000.0}
    with_special = tax_engine.calculate_tax(income, deductions, regime=regime, special_tax_components=special)
    assert with_special["tax_after_cess"] >= res["tax_after_cess"]
    # increase should be at least the raw special tax (surcharge/cess may increase it further)
    expected_min = res["tax_after_cess"] + sum(special.values()) * 0.99
    assert with_special["tax_after_cess"] + 1e-6 >= expected_min
