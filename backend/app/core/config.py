import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    # App
    APP_NAME: str = "OpenTap"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/opentap"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/opentap"

    # Auth
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ALGORITHM: str = "HS256"

    # Cloudflare R2
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "opentap-photos"
    R2_PUBLIC_URL: str = ""
    R2_ENDPOINT_URL: str = ""

    # Rate limiting
    RATE_LIMIT_REPORTS_PER_HOUR: int = 10
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60

    # Report lifecycle
    STALE_THRESHOLD_DAYS: int = 14

    # Internal API key
    INTERNAL_API_KEY: str = "change-me-internal-key"

    # resend
    RESEND_API_KEY: str = ""


@lru_cache()
def get_settings() -> Settings:
    return Settings()