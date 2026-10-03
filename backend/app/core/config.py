from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_uri: str | None = None
    database_name: str = "ai_response_quality"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    mongodb_server_selection_timeout_ms: int = 3000
    jwt_secret: SecretStr = Field(min_length=32)
    jwt_access_token_minutes: int = Field(default=30, ge=5, le=1440)
    auth_cookie_secure: bool = False
    auth_cookie_name: str = "rq_access_token"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()