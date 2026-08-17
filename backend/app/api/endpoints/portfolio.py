from typing import Optional
from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_optional_current_user
from app.models.user import User
from app.services import tax_engine, user_service
from app.services.portfolio_service import parse_and_calc

router = APIRouter()


@router.post("/analyze")
async def analyze(
    file: Optional[UploadFile] = File(None),
    csv_text: Optional[str] = Body(None),
    income: Optional[float] = Form(None),
    deductions: Optional[float] = Form(0.0),
    regime: Optional[str] = Form("old"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze uploaded broker CSV and optionally return a full tax summary.

    - If `income` is provided, the endpoint will call `tax_engine.calculate_tax`
      with aggregated special-tax components and return `tax_summary`.
    - If the user is authenticated and `income` is not provided, the endpoint will
      attempt to lookup the authenticated user's financials securely from the database.
    """
    txt = None
    if file is not None:
        if not file.filename.endswith(".csv"):
            raise HTTPException(400, "Needs CSV")
        c = await file.read()
        try:
            txt = c.decode("utf-8")
        except Exception:
            raise HTTPException(400, "Bad encoding")
    elif csv_text:
        txt = csv_text
    else:
        raise HTTPException(
            400, "No CSV provided; upload file or include csv_text in JSON body"
        )

    items = parse_and_calc(txt)

    # Aggregate special-tax pre-cess amounts by category
    stcg = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "STCG")
    ltcg = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "LTCG")
    slab_comp = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "Slab")

    special = {"stcg_tax": stcg, "ltcg_tax": ltcg, "slab_tax": slab_comp}

    result = {"data": items, "special_tax_components": special}

    # Determine income/deductions: prefer explicit form fields,
    # otherwise try to fetch for authenticated user from DB
    used_income = income
    used_deductions = deductions or 0.0

    if used_income is None and current_user is not None:
        try:
            profile = await user_service.get_user_financials_from_db(db, current_user.id)
            if not profile:
                profile = user_service.get_user_financials(current_user.id)
            if profile:
                used_income = float(profile.get("income", 0.0))
                used_deductions = float(profile.get("deductions", 0.0))
        except Exception:
            used_income = None

    # Calculate tax summary if income is available
    if used_income is not None:
        tax_summary = tax_engine.calculate_tax(
            used_income,
            used_deductions,
            regime=regime or "old",
            special_tax_components=special,
        )
        result["tax_summary"] = tax_summary

    return result

