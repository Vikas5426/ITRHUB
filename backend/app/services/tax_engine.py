from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

# Simple, configurable slab-based tax engine. Slabs are defined as list of (upper_limit, rate)
# upper_limit is inclusive upper bound for that slab. Use None for infinity.

CESS_RATE = 0.04


@dataclass
class Slab:
    upper: int | None
    rate: float


# Old Tax Regime Slabs (Traditional)
DEFAULT_OLD_REGIME_SLABS: List[Slab] = [
    Slab(250_000, 0.0),
    Slab(500_000, 0.05),
    Slab(1_000_000, 0.20),
    Slab(None, 0.30),
]

# New Tax Regime Slabs (Section 115BAC for AY 2026-27 / FY 2025-26)
DEFAULT_NEW_REGIME_SLABS: List[Slab] = [
    Slab(300_000, 0.0),
    Slab(700_000, 0.05),
    Slab(1_000_000, 0.10),
    Slab(1_200_000, 0.15),
    Slab(1_500_000, 0.20),
    Slab(None, 0.30),
]


def _compute_slabs(income: int, slabs: List[Slab]) -> Tuple[List[Dict[str, Any]], float]:
    remaining = max(0, income)
    last_upper = 0
    breakdown: List[Dict[str, Any]] = []
    total_tax = 0.0

    for slab in slabs:
        upper = slab.upper if slab.upper is not None else None
        if upper is None:
            taxable = max(0, remaining)
        else:
            slab_amount = upper - last_upper
            taxable = max(0, min(remaining, slab_amount))

        tax = taxable * slab.rate
        lower = last_upper if last_upper == 0 else last_upper + 1
        breakdown.append({
            "from": lower,
            "to": upper,
            "rate": slab.rate,
            "taxable": taxable,
            "tax": round(tax, 2)
        })
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
    if total_income > 5_00_00_000:
        return 0.25  # Capped at 25% under New Regime
    if total_income > 2_00_00_000:
        return 0.25
    if total_income > 1_00_00_000:
        return 0.15
    if total_income > 50_00_000:
        return 0.10
    return 0.0


def calculate_tax(
    income: float,
    deductions: float = 0.0,
    regime: str = "new",
    apply_standard_deduction: bool = False,
    standard_deduction_amount: float | None = None,
    special_tax_components: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """Calculate tax for a single regime and return slab breakdown and totals.

    regime: 'old' or 'new'
    """
    regime = regime.lower()
    if standard_deduction_amount is None:
        standard_deduction_amount = 75_000 if regime == "new" else 50_000

    total_deductions = float(deductions or 0)
    if apply_standard_deduction:
        total_deductions += float(standard_deduction_amount or 0)

    taxable_income = max(0.0, float(income or 0) - total_deductions)
    slabs = DEFAULT_OLD_REGIME_SLABS if regime == "old" else DEFAULT_NEW_REGIME_SLABS
    breakdown, slab_tax = _compute_slabs(int(taxable_income), slabs)

    # Special tax components (e.g. STCG 15%/20%, LTCG 10%/12.5%, VDA 30%)
    special_tax_total = 0.0
    if special_tax_components:
        for v in special_tax_components.values():
            try:
                special_tax_total += float(v)
            except Exception:
                continue

    # Section 87A Rebate:
    # Under Old Regime: Taxable income <= ₹5,00,000 gets 100% rebate (max ₹12,500)
    # Under New Regime (115BAC): Taxable income <= ₹7,00,000 gets 100% rebate (max ₹25,000)
    rebate_limit = 500_000 if regime == "old" else 700_000
    rebate_applied = False
    rebate_amount = 0.0

    if taxable_income <= rebate_limit and slab_tax > 0:
        rebate_amount = slab_tax
        slab_tax = 0.0
        rebate_applied = True
    elif regime == "new" and taxable_income > 700_000:
        # Marginal Relief under Section 115BAC: Tax payable cannot exceed excess income over 7L
        excess_income = taxable_income - 700_000
        if slab_tax > excess_income:
            marginal_relief = slab_tax - excess_income
            rebate_amount = marginal_relief
            slab_tax = excess_income
            rebate_applied = True

    tax_before_surcharge = round(slab_tax + special_tax_total, 2)

    # Surcharge
    surcharge_rate = _get_surcharge_rate(income)
    surcharge_amount = round(tax_before_surcharge * surcharge_rate, 2) if surcharge_rate > 0 else 0.0

    tax_after_surcharge = round(tax_before_surcharge + surcharge_amount, 2)

    # 4% Health & Education Cess
    cess = round(tax_after_surcharge * CESS_RATE, 2)
    total_tax = round(tax_after_surcharge + cess, 2)

    effective_rate = round((total_tax / income * 100), 2) if income > 0 else 0.0

    return {
        "regime": regime,
        "gross_income": round(income, 2),
        "standard_deduction": standard_deduction_amount if apply_standard_deduction else 0.0,
        "deductions": round(total_deductions, 2),
        "taxable_income": int(taxable_income),
        "breakdown": breakdown,
        "slab_tax": slab_tax,
        "tax_before_surcharge": round(tax_before_surcharge, 2),
        "surcharge_rate": surcharge_rate,
        "surcharge_amount": surcharge_amount,
        "tax_after_surcharge": tax_after_surcharge,
        "cess": cess,
        "tax_after_cess": total_tax,
        "rebate_applied": rebate_applied,
        "rebate_amount": rebate_amount,
        "effective_rate": effective_rate,
    }


def compare_regimes(income: float, old_deductions: float = 0.0, **kwargs) -> Dict[str, Any]:
    ded = old_deductions if old_deductions else kwargs.get("deductions", 0.0)
    old = calculate_tax(income, ded, regime="old")
    new = calculate_tax(income, 0.0, regime="new")

    diff = round(abs(old["tax_after_cess"] - new["tax_after_cess"]), 2)
    optimal = "new" if new["tax_after_cess"] <= old["tax_after_cess"] else "old"

    return {
        "old": old,
        "new": new,
        "optimal_regime": optimal,
        "tax_savings": diff,
        "is_new_better": new["tax_after_cess"] <= old["tax_after_cess"],
    }


def estimate_refund(income: float, deductions: float, tds_paid: float, regime: str = "new") -> Dict[str, Any]:
    calc = calculate_tax(income, deductions, regime=regime)
    payable = calc["tax_after_cess"]
    diff = round(tds_paid - payable, 2)
    return {
        "payable": payable,
        "tds_paid": tds_paid,
        "refund": diff if diff > 0 else 0.0,
        "due": -diff if diff < 0 else 0.0,
    }


def select_itr(
    has_salary: bool = True,
    has_business: bool = False,
    has_capital_gains: bool = False,
    has_foreign_income: bool = False,
    is_presumptive: bool = False,
) -> str:
    """Standard statutory ITR selector for AY 2026-27."""
    if has_business:
        if is_presumptive:
            return "ITR-4"
        return "ITR-3"
    if has_foreign_income or has_capital_gains:
        return "ITR-2"
    if has_salary and not has_capital_gains and not has_business and not has_foreign_income:
        return "ITR-1"
    return "ITR-1"

