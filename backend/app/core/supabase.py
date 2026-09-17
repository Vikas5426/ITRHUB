from functools import lru_cache
from typing import Any, Optional

from app.core.config import get_settings

try:
	from supabase import Client, create_client
	_SUPABASE_SDK_AVAILABLE = True
except ImportError:
	_SUPABASE_SDK_AVAILABLE = False
	Client = Any  # type: ignore


@lru_cache
def get_supabase_client() -> Optional["Client"]:
	"""
	Returns a Supabase client configured with the project URL and anonymous key.
	Returns None if the credentials or SDK are not available.
	"""
	if not _SUPABASE_SDK_AVAILABLE:
		return None

	settings = get_settings()
	if not settings.supabase_url or not settings.supabase_anon_key:
		return None

	return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache
def get_supabase_admin_client() -> Optional["Client"]:
	"""
	Returns a Supabase client configured with the service role key for elevated backend operations.
	Returns None if the service role key is not configured.
	"""
	if not _SUPABASE_SDK_AVAILABLE:
		return None

	settings = get_settings()
	if not settings.supabase_url or not settings.supabase_service_role_key:
		return None

	return create_client(settings.supabase_url, settings.supabase_service_role_key)
