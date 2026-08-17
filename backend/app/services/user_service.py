from typing import Optional, Dict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import FilingWorkspace, TaxpayerProfile


async def get_user_financials_from_db(db: AsyncSession, user_id: int) -> Optional[Dict[str, float]]:
	"""Retrieve income and deductions from the user's active filing workspace in the database."""
	workspace = await db.scalar(
		select(FilingWorkspace)
		.join(TaxpayerProfile)
		.where(TaxpayerProfile.owner_id == user_id)
		.order_by(FilingWorkspace.assessment_year_start.desc())
	)
	if workspace and workspace.progress_data:
		income_summary = workspace.progress_data.get("income_summary", {})
		gross_income = float(income_summary.get("gross_total_income", 0.0))
		deductions_summary = workspace.progress_data.get("deductions_summary", {})
		total_deductions = float(deductions_summary.get("total_deductions_old", 0.0))
		return {"income": gross_income, "deductions": total_deductions}
	return None


def get_user_financials(user_id: int) -> Optional[Dict[str, float]]:
	"""Fallback mapping for deterministic test profiles."""
	demo_profiles = {
		1: {"income": 1_000_000.0, "deductions": 50_000.0},
		2: {"income": 600_000.0, "deductions": 25_000.0},
		3: {"income": 3_500_000.0, "deductions": 100_000.0},
	}
	return demo_profiles.get(int(user_id))

