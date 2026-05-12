from pydantic import BaseModel, Field
from typing import List, Optional, Any


class SlabItem(BaseModel):
    from_: int = Field(..., alias="from")
    to: Optional[int]
    rate: float
    taxable: float
    tax: float


class TaxResponse(BaseModel):
    regime: str
    income: float
    deductions: float
    taxable_income: int
    breakdown: List[Any]
    tax_before_cess: float
    cess: float
    tax_after_cess: float


class CompareResponse(BaseModel):
    old: TaxResponse
    new: TaxResponse


class TaxRequest(BaseModel):
    income: float
    deductions: float = 0.0
    regime: Optional[str] = None


class RefundRequest(BaseModel):
    income: float
    deductions: float = 0.0
    tds_paid: float = 0.0
    regime: str = "old"


class RefundResponse(BaseModel):
    payable: float
    tds_paid: float
    refund: float
    due: float


class ITRRequest(BaseModel):
    has_salary: bool = True
    has_business: bool = False
    has_capital_gains: bool = False
    has_foreign_income: bool = False
    is_presumptive: bool = False


class ITRResponse(BaseModel):
    itr: str


class SlabItemDisplay(BaseModel):
    label: str
    rate: float
    taxable: float
    tax: float


class SlabDisplayResponse(BaseModel):
    regime: str
    taxable_income: int
    slabs: List[SlabItemDisplay]
