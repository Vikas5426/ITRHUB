from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.portfolio_service import parse_and_calc
from app.services import tax_engine

router = APIRouter()


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(400, "Needs CSV")
    c = await file.read()
    try:
        txt = c.decode('utf-8')
    except:
        raise HTTPException(400, "Bad encoding")

    items = parse_and_calc(txt)

    # Aggregate special-tax pre-cess amounts by category
    stcg = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "STCG")
    ltcg = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "LTCG")
    slab_comp = sum(i.get("tax_pre_cess", 0.0) for i in items if i.get("cat") == "Slab")

    special = {"stcg_tax": stcg, "ltcg_tax": ltcg, "slab_tax": slab_comp}

    # The endpoint doesn't know salary/business; caller can provide income/deductions separately.
    # We return the aggregated items and the special-tax totals for clients to combine.
    return {"data": items, "special_tax_components": special}
