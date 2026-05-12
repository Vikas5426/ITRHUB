from fastapi import APIRouter

from app.schemas.tax import TaxRequest, CompareResponse, RefundRequest, RefundResponse, ITRRequest, ITRResponse
from app.services import tax_engine

router = APIRouter()


@router.post("/calculate", response_model=CompareResponse)
def calculate_tax(req: TaxRequest):
    income = req.income
    deductions = req.deductions
    return tax_engine.compare_regimes(income, deductions)


@router.post("/refund", response_model=RefundResponse)
def refund_estimate(req: RefundRequest):
    return tax_engine.estimate_refund(req.income, req.deductions, req.tds_paid, req.regime)


@router.post("/select-itr", response_model=ITRResponse)
def select_itr(req: ITRRequest):
    itr = tax_engine.select_itr(
        has_salary=req.has_salary,
        has_business=req.has_business,
        has_capital_gains=req.has_capital_gains,
        has_foreign_income=req.has_foreign_income,
        is_presumptive=req.is_presumptive,
    )
    return {"itr": itr}


@router.post("/slab", response_model=dict)
def slab_display(req: TaxRequest):
    """Return slab-friendly breakdown for frontend charts.

    If `regime` is provided ("old" or "new"), returns that regime only.
    Otherwise returns both under keys `old` and `new`.
    """
    income = req.income
    deductions = req.deductions

    def format_breakdown(res):
        slabs = []
        def fmt(n):
            try:
                return f"₹{int(n):,}"
            except Exception:
                return str(n)
        for b in res["breakdown"]:
            lower = b.get("from")
            to = b.get("to")
            if to is None:
                label = f"{fmt(lower)}+"
            else:
                label = f"{fmt(lower)} - {fmt(to)}"
            slabs.append({
                "label": label,
                "rate": b.get("rate"),
                "taxable": b.get("taxable"),
                "tax": b.get("tax"),
            })
        return {"regime": res["regime"], "taxable_income": res["taxable_income"], "slabs": slabs}

    if req.regime:
        res = tax_engine.calculate_tax(income, deductions, regime=req.regime)
        return format_breakdown(res)

    return {"old": format_breakdown(tax_engine.calculate_tax(income, deductions, regime="old")), "new": format_breakdown(tax_engine.calculate_tax(income, deductions, regime="new"))}
