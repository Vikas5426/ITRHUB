from fastapi import APIRouter
from datetime import date

router = APIRouter()

@router.get("/calculate")
def get_deadlines(u_type: str, has_audit: bool = False, is_presumptive: bool = False):
    dl = []
    y = 2026
    t = date.today()

    if has_audit:
        dl += [("Audit Report", date(y, 9, 30)), ("ITR Filing", date(y, 10, 31))]
    elif u_type.lower() == "business":
        dl.append(("ITR Filing", date(y, 8, 31)))
    else:
        dl.append(("ITR Filing", date(y, 7, 31)))

    if is_presumptive:
        dl.append(("Advance Tax (100%)", date(y+1, 3, 15)))
    else:
        dl += [
            ("Adv Tax Q1", date(y, 6, 15)),
            ("Adv Tax Q2", date(y, 9, 15)),
            ("Adv Tax Q3", date(y, 12, 15)),
            ("Adv Tax Q4", date(y+1, 3, 15))
        ]

    return [{"name": n, "date": str(d), "days_remaining": max(0, (d - t).days)} for n, d in dl]
