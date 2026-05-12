from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Body
from typing import Optional
from app.services.portfolio_service import parse_and_calc
from app.services import tax_engine

router = APIRouter()


@router.post("/analyze")
async def analyze(
    file: Optional[UploadFile] = File(None),
    csv_text: Optional[str] = Body(None),
    income: Optional[float] = Form(None),
    deductions: Optional[float] = Form(0.0),
    regime: Optional[str] = Form("old"),
    user_id: Optional[int] = Form(None),
):
    """Analyze uploaded broker CSV and optionally return a full tax summary.

    - If `income` is provided, the endpoint will call `tax_engine.calculate_tax`
      with aggregated special-tax components and return `tax_summary`.
    - If `user_id` is provided and `income` is not, the endpoint will attempt to
      lookup user income/deductions (best-effort; returns only when a lookup exists).
    """
    txt = None
    if file is not None:
        if not file.filename.endswith('.csv'):
            raise HTTPException(400, "Needs CSV")
        c = await file.read()
        try:
            txt = c.decode('utf-8')
        except Exception:
            raise HTTPException(400, "Bad encoding")
    elif csv_text:
        txt = csv_text
    else:
        raise HTTPException(400, "No CSV provided; upload file or include csv_text in JSON body")

    items = parse_and_calc(txt)

    # Aggregate special-tax pre-cess amounts by category
    stcg = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "STCG")
    ltcg = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "LTCG")
    slab_comp = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "Slab")

    special = {"stcg_tax": stcg, "ltcg_tax": ltcg, "slab_tax": slab_comp}

    result = {"data": items, "special_tax_components": special}

    # Attempt to determine income/deductions: prefer explicit form fields,
    # otherwise try to fetch from user profile if user_id supplied (best-effort).
    used_income = income
    used_deductions = deductions or 0.0

    # Try user lookup if income not provided
    if used_income is None and user_id is not None:
        try:
            from app.services import user_service

            profile = user_service.get_user_financials(user_id)
            if profile:
                used_income = float(profile.get("income", 0.0))
                used_deductions = float(profile.get("deductions", 0.0))
        except Exception:
            used_income = None

    # Strict validation: require either explicit income or user_id-resolved income
    if used_income is None:
        raise HTTPException(400, "Provide `income` or `user_id` to compute tax summary")

    tax_summary = tax_engine.calculate_tax(
        used_income, used_deductions, regime=regime or "old", special_tax_components=special
    )
    result["tax_summary"] = tax_summary

    return result
