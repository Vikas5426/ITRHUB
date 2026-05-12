"""Lightweight user financials helper for tests and demo flows.

This provides a best-effort `get_user_financials(user_id)` used by the
portfolio analyze endpoint when callers pass `user_id`. In production this
should read from the database; here we return deterministic testable data.
"""
from typing import Optional, Dict


def get_user_financials(user_id: int) -> Optional[Dict[str, float]]:
	"""Return a simple income/deductions mapping for the given user_id.

	This is intentionally deterministic for tests. Real implementations should
	query the user database and handle missing data appropriately.
	"""
	# Simple deterministic map for testing/demo
	demo_profiles = {
		1: {"income": 1_000_000.0, "deductions": 50_000.0},
		2: {"income": 600_000.0, "deductions": 25_000.0},
		3: {"income": 3_500_000.0, "deductions": 100_000.0},
	}

	return demo_profiles.get(int(user_id))
