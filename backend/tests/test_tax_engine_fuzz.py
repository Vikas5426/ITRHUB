import pytest

pytest.importorskip("hypothesis")
from hypothesis import given, strategies as st, settings

from app.services import tax_engine


@settings(max_examples=200)
@given(
    income=st.integers(min_value=0, max_value=50_000_000),
    deductions=st.integers(min_value=0, max_value=1_000_000),
    regime=st.sampled_from(["old", "new"]),
    stcg=st.integers(min_value=0, max_value=200_000),
    ltcg=st.integers(min_value=0, max_value=200_000),
)
def test_tax_engine_fuzz(income, deductions, regime, stcg, ltcg):
    deductions = min(deductions, income)
    base = tax_engine.calculate_tax(income, deductions, regime=regime)
    components = {"stcg_tax": float(stcg), "ltcg_tax": float(ltcg)}
    combined = tax_engine.calculate_tax(income, deductions, regime=regime, special_tax_components=components)

    # invariants
    assert base["tax_after_cess"] >= 0
    assert combined["tax_after_cess"] >= base["tax_after_cess"]
    assert combined["surcharge_rate"] == tax_engine._get_surcharge_rate(income)
