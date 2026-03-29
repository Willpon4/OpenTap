import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    ALGORITHM: str = "HS256"

    # SMS (Twilio)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # Photo storage (Cloudflare R2 / S3-compatible)
    STORAGE_ENDPOINT: str = ""
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""
    STORAGE_BUCKET: str = "opentap-photos"
    STORAGE_PUBLIC_URL: str = ""

    # Rate limiting
    RATE_LIMIT_REPORTS_PER_HOUR: int = 10
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60

    # Report lifecycle
    STALE_THRESHOLD_DAYS: int = 14  # days before unacknowledged report goes stale

    # Internal API key for cron jobs / data imports
    INTERNAL_API_KEY: str = "change-me-internal-key"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
