import json
import os
from app.services import tax_engine


def load_vectors():
    p = os.path.join(os.path.dirname(__file__), "vectors", "official_examples.json")
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def test_official_vectors():
    vecs = load_vectors()
    for v in vecs:
        income = v.get("income", 0)
        deductions = v.get("deductions", 0)
        regime = v.get("regime", "old")
        # If CSV includes gains, parse and pass special components
        csv = v.get("csv", "")
        special = None
        if csv:
            from app.services.portfolio_service import parse_and_calc

            items = parse_and_calc(csv)
            stcg = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "STCG")
            ltcg = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "LTCG")
            special = {"stcg_tax": stcg, "ltcg_tax": ltcg}

        res = tax_engine.calculate_tax(income, deductions, regime=regime, special_tax_components=special)
        assert res["tax_after_cess"] == v["expected_tax_after_cess"]
