from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	app_name: str = "ITRHUB"
	environment: str = "development"
	api_v1_prefix: str = "/api"
	cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

	database_url: str = "sqlite+aiosqlite:///./itrhub.db"
	redis_url: str = "redis://localhost:6379/0"
	secret_key: str = "change-this-secret-before-production"
	document_encryption_key: str = ""
	access_token_expire_minutes: int = 60 * 24 * 7
	auth_cookie_name: str = "itrhub_session"
	secure_cookies: bool = False
	max_document_bytes: int = 10 * 1024 * 1024
	auto_create_tables: bool = True

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		case_sensitive=False,
		extra="ignore",
	)


@lru_cache
def get_settings() -> Settings:
	return Settings()
