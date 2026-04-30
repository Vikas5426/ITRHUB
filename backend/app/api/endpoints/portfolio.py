from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.portfolio_service import parse_and_calc

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
    
    res = parse_and_calc(txt)
    return {"data": res}
