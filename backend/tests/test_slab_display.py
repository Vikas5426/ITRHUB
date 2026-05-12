from app.services.tax_engine import calculate_tax


def test_slab_display_structure_old():
    res = calculate_tax(600_000, deductions=0, regime="old")
    assert "breakdown" in res
    bd = res["breakdown"]
    assert isinstance(bd, list)
    # ensure there is at least one slab with a numeric tax
    assert any(item["tax"] >= 0 for item in bd)


def test_slab_display_labels_format():
    res = calculate_tax(600_000, deductions=0, regime="new")
    bd = res["breakdown"]
    # check first breakdown item contains rate and taxable
    first = bd[0]
    assert "rate" in first and "taxable" in first
