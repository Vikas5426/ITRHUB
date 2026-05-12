import csv
from dataclasses import dataclass
from datetime import date
from io import StringIO
from typing import Any

from dateutil import parser

CESS_RATE = 0.04
DEFAULT_SLAB_RATE = 0.30
LTCG_RATE = 0.125
STCG_RATE = 0.20
EQUITY_LTCG_EXEMPTION = 125_000

LISTED_EQUITY_TYPES = {"Listed Equity", "Equity MFs"}


@dataclass(frozen=True)
class TradeInput:
    name: str
    asset_type: str
    buy_date: date
    sell_date: date
    buy_price: float
    sell_price: float
    quantity: float


def _normalize_asset_type(asset_type: str | None) -> str:
    return (asset_type or "Listed Equity").strip() or "Listed Equity"


def _parse_trade(row: dict[str, str]) -> TradeInput | None:
    try:
        buy_date = parser.parse(row["Buy Date"].strip()).date()
        sell_date = parser.parse(row["Sell Date"].strip()).date()
    except Exception:
        return None

    try:
        return TradeInput(
            name=(row.get("Asset Name", "Unknown") or "Unknown").strip() or "Unknown",
            asset_type=_normalize_asset_type(row.get("Asset Type")),
            buy_date=buy_date,
            sell_date=sell_date,
            buy_price=float(row.get("Buy Price", 0) or 0),
            sell_price=float(row.get("Sell Price", 0) or 0),
            quantity=float(row.get("Quantity", 0) or 0),
        )
    except (TypeError, ValueError):
        return None


def _holding_days(trade: TradeInput) -> int:
    return (trade.sell_date - trade.buy_date).days


def _is_ltcg(trade: TradeInput, holding_days: int) -> bool:
    if trade.asset_type == "Debt Mutual Fund":
        return trade.buy_date < date(2023, 4, 1) and holding_days > 1095
    if trade.asset_type in {"Real Estate", "Gold", "Unlisted Shares"}:
        return holding_days > 730
    return holding_days > 365


def _apply_cess(tax: float) -> float:
    return tax * (1 + CESS_RATE)


def _tax_for_trade(trade: TradeInput, slab_rate: float = DEFAULT_SLAB_RATE) -> tuple[float, str, dict[str, float] | None]:
    holding_days = _holding_days(trade)
    gain = (trade.sell_price - trade.buy_price) * trade.quantity

    if gain <= 0:
        return 0.0, "Loss", None

    if trade.asset_type == "Debt Mutual Fund":
        if trade.buy_date >= date(2023, 4, 1):
            return gain * slab_rate, "Slab", None
        if holding_days > 1095:
            return gain * LTCG_RATE, "LTCG", None
        return gain * slab_rate, "STCG", None

    if trade.asset_type in {"Real Estate", "Gold", "Unlisted Shares"}:
        if _is_ltcg(trade, holding_days):
            if trade.asset_type == "Real Estate" and trade.buy_date < date(2024, 7, 23):
                option_one = gain * LTCG_RATE
                option_two = (gain * 0.7) * 0.20
                chosen = min(option_one, option_two)
                return chosen, "LTCG", {"opt1": option_one, "opt2": option_two, "chosen": chosen}
            return gain * LTCG_RATE, "LTCG", None
        return gain * slab_rate, "STCG", None

    if _is_ltcg(trade, holding_days):
        return gain * LTCG_RATE, "LTCG", None
    return gain * STCG_RATE, "STCG", None


def _apply_equity_exemption(results: list[dict[str, Any]]) -> None:
    remaining_exemption = EQUITY_LTCG_EXEMPTION

    for item in results:
        if item["type"] not in LISTED_EQUITY_TYPES or item["cat"] != "LTCG" or item["gain"] <= 0:
            continue

        if remaining_exemption <= 0:
            taxable_gain = item["gain"]
        elif item["gain"] <= remaining_exemption:
            remaining_exemption -= item["gain"]
            item["tax_pre_cess"] = 0.0
            item["tax"] = 0.0
            continue
        else:
            taxable_gain = item["gain"] - remaining_exemption
            remaining_exemption = 0

        # update pre-cess and post-cess taxes
        item["tax_pre_cess"] = taxable_gain * LTCG_RATE
        item["tax"] = _apply_cess(item["tax_pre_cess"])


def parse_and_calc(content: str, slab_rate: float = DEFAULT_SLAB_RATE) -> list[dict[str, Any]]:
    reader = csv.DictReader(StringIO(content))
    results: list[dict[str, Any]] = []

    for row in reader:
        trade = _parse_trade(row)
        if trade is None:
            continue

        holding_days = _holding_days(trade)
        gain = (trade.sell_price - trade.buy_price) * trade.quantity
        tax, category, comparison = _tax_for_trade(trade, slab_rate=slab_rate)

        results.append(
            {
                "id": len(results),
                "name": trade.name,
                "type": trade.asset_type,
                "days": holding_days,
                "gain": gain,
                "tax_pre_cess": tax,
                "tax": _apply_cess(tax) if gain > 0 and trade.asset_type not in LISTED_EQUITY_TYPES else tax,
                "bd": trade.buy_date.isoformat(),
                "sd": trade.sell_date.isoformat(),
                "cat": category,
                "comp": comparison,
            }
        )

    _apply_equity_exemption(results)
    return results
