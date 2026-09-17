from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	app_name: str = "ITRHUB"
	environment: str = "development"
	api_v1_prefix: str = "/api"
	cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

	# Database configuration (Supabase PostgreSQL / SQLite fallback for tests)
	database_url: str = "sqlite+aiosqlite:///./itrhub.db"
	secret_key: str = "change-this-secret-before-production"
	document_encryption_key: str = ""
	access_token_expire_minutes: int = 60 * 24 * 7
	auth_cookie_name: str = "itrhub_session"
	secure_cookies: bool = False
	max_document_bytes: int = 10 * 1024 * 1024
	auto_create_tables: bool = True

	# Supabase Credentials
	supabase_url: str = ""
	supabase_anon_key: str = ""
	supabase_service_role_key: str = ""
	supabase_db_password: str = ""

	# AI Assistant (Groq)
	groq_api_key: str = ""
	ai_model: str = "openai/gpt-oss-120b"
	ai_temperature: float = 0.2
	ai_max_tokens: int = 2048
	ai_reasoning_effort: str = "medium"
	ai_timeout: int = 30

	@field_validator("database_url", mode="after")
	@classmethod
	def normalize_database_url(cls, v: str) -> str:
		if not v:
			return v
		# Automatically convert standard postgres:// or postgresql:// to asyncpg dialect for SQLAlchemy
		if v.startswith("postgres://"):
			v = "postgresql+asyncpg://" + v[len("postgres://"):]
		elif v.startswith("postgresql://"):
			v = "postgresql+asyncpg://" + v[len("postgresql://"):]
		return v

	@property
	def effective_database_url(self) -> str:
		"""Returns the active database URL, normalizing Supabase URL or using database_url."""
		return self.database_url

	@property
	def is_supabase(self) -> bool:
		url = self.effective_database_url
		return (
			"supabase.co" in url
			or "pooler.supabase.com" in url
			or bool(self.supabase_url)
		)


	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		case_sensitive=False,
		extra="ignore",
	)


@lru_cache
def get_settings() -> Settings:
	return Settings()

