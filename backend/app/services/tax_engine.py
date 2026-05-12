from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional

# Simple, configurable slab-based tax engine. Slabs are defined as list of (upper_limit, rate)
# upper_limit is inclusive upper bound for that slab. Use None for infinity.

CESS_RATE = 0.04


@dataclass
class Slab:
    upper: int | None
    rate: float


DEFAULT_OLD_REGIME_SLABS: List[Slab] = [
    Slab(250_000, 0.0),
    Slab(500_000, 0.05),
    Slab(1_000_000, 0.20),
    Slab(None, 0.30),
]

DEFAULT_NEW_REGIME_SLABS: List[Slab] = [
    Slab(300_000, 0.0),
    Slab(700_000, 0.05),
    Slab(1_000_000, 0.10),
    Slab(1_200_000, 0.15),
    Slab(1_500_000, 0.20),
    Slab(None, 0.30),
]


def _compute_slabs(income: int, slabs: List[Slab]) -> Tuple[List[Dict], float]:
    remaining = income
    last_upper = 0
    breakdown: List[Dict] = []
    total_tax = 0.0

    for slab in slabs:
        upper = slab.upper if slab.upper is not None else None
        if upper is None:
            taxable = max(0, remaining)
        else:
            slab_amount = upper - last_upper
            taxable = max(0, min(remaining, slab_amount))

        tax = taxable * slab.rate
        # represent ranges as numeric from-to (inclusive lower bound)
        lower = last_upper if last_upper == 0 else last_upper + 1
        breakdown.append({"from": lower, "to": upper, "rate": slab.rate, "taxable": taxable, "tax": round(tax, 2)})
        total_tax += tax

        if upper is None:
            remaining = 0
            break

        remaining -= taxable
        last_upper = upper
        if remaining <= 0:
            break

    return breakdown, round(total_tax, 2)


def _get_surcharge_rate(total_income: float) -> float:
    """Return surcharge rate (as decimal) based on total income (individual rates)."""
    # Typical surcharge bands for individuals
    if total_income > 5_00_00_000:  # > 5 crore
        return 0.37
    if total_income > 2_00_00_000:  # > 2 crore
        return 0.25
    if total_income > 1_00_00_000:  # > 1 crore
        return 0.15
    if total_income > 50_00_000:  # > 50 lakh
        return 0.10
    return 0.0


def calculate_tax(
    income: float,
    deductions: float = 0.0,
    regime: str = "old",
    apply_standard_deduction: bool = False,
    standard_deduction_amount: float = 75_000,
    special_tax_components: Optional[Dict[str, float]] = None,
) -> Dict:
    """Calculate tax for a single regime and return slab breakdown and totals.

    regime: 'old' or 'new'
    """
    # apply standard deduction for new regime if requested
    if regime == "new" and apply_standard_deduction:
        deductions = deductions + (standard_deduction_amount or 0)

    taxable_income = max(0.0, income - deductions)
    slabs = DEFAULT_OLD_REGIME_SLABS if regime == "old" else DEFAULT_NEW_REGIME_SLABS
    breakdown, slab_tax = _compute_slabs(int(taxable_income), slabs)

    # If external components (STCG/LTCG/VDA/crypto) provide precomputed taxes,
    # include them into the tax base before surcharge and cess. Values in
    # `special_tax_components` should be tax amounts (not incomes), e.g.
    # {"stcg_tax": 1234.5, "ltcg_tax": 6789.0}
    special_tax_total = 0.0
    if special_tax_components:
        for k, v in special_tax_components.items():
            try:
                special_tax_total += float(v)
            except Exception:
                continue

    # Apply 87A rebate: only applies to slab-based tax portion (so that
    # separately taxed components like LTCG/STCG are preserved).
    rebate_limit = 500_000 if regime == "old" else 700_000
    rebate_applied = False
    rebate_amount = 0.0
    if income <= rebate_limit and slab_tax > 0:
        rebate_amount = slab_tax
        slab_tax = 0.0
        rebate_applied = True

    # include special taxes into pre-surcharge tax total
    tax_before_surcharge = round(slab_tax + special_tax_total, 2)

    # Surcharge
    surcharge_rate = _get_surcharge_rate(income)
    surcharge_amount = round(tax_before_surcharge * surcharge_rate, 2) if surcharge_rate > 0 else 0.0

    tax_after_surcharge = round(tax_before_surcharge + surcharge_amount, 2)

    # Health & Education Cess on tax + surcharge
    cess = round(tax_after_surcharge * CESS_RATE, 2)
    total_tax = round(tax_after_surcharge + cess, 2)

    return {
        "regime": regime,
        "income": income,
        "deductions": deductions,
        "taxable_income": int(taxable_income),
        "breakdown": breakdown,
        "tax_before_surcharge": round(tax_before_surcharge, 2),
        "surcharge_rate": surcharge_rate,
        "surcharge_amount": surcharge_amount,
        "tax_after_surcharge": tax_after_surcharge,
        "cess": cess,
        "tax_after_cess": total_tax,
        "rebate_applied": rebate_applied,
        "rebate_amount": rebate_amount,
    }


def compare_regimes(income: float, deductions: float = 0.0) -> Dict:
    old = calculate_tax(income, deductions, regime="old")
    new = calculate_tax(income, deductions, regime="new")
    return {"old": old, "new": new}


def estimate_refund(income: float, deductions: float, tds_paid: float, regime: str = "old") -> Dict:
    calc = calculate_tax(income, deductions, regime=regime)
    payable = calc["tax_after_cess"]
    diff = round(tds_paid - payable, 2)
    return {"payable": payable, "tds_paid": tds_paid, "refund": diff if diff > 0 else 0.0, "due": -diff if diff < 0 else 0.0}


def select_itr(has_salary: bool = True, has_business: bool = False, has_capital_gains: bool = False, has_foreign_income: bool = False, is_presumptive: bool = False) -> str:
    """Simple rule-based ITR selector.

    Returns one of ITR-1..ITR-7
    """
    if has_business:
        if is_presumptive:
            return "ITR-4"
        return "ITR-3"
    if has_foreign_income or has_capital_gains:
        return "ITR-2"
    if has_salary and not has_capital_gains and not has_business and not has_foreign_income:
        return "ITR-1"
    return "ITR-1"
