from app.services.tax_engine import select_itr


def test_select_itr_salary_only():
    itr = select_itr(has_salary=True, has_business=False, has_capital_gains=False)
    assert itr == "ITR-1"


def test_select_itr_business_non_presumptive():
    itr = select_itr(has_salary=False, has_business=True, is_presumptive=False)
    assert itr == "ITR-3"
