from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	app_name: str = "ITRHUB"
	environment: str = "development"
	api_v1_prefix: str = "/api"
	cors_origins: list[str] = ["*"]

	database_url: str = "sqlite+aiosqlite:///./itrhub.db"
	redis_url: str = "redis://localhost:6379/0"

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		case_sensitive=False,
		extra="ignore",
	)


@lru_cache
def get_settings() -> Settings:
	return Settings()
