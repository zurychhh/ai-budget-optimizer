"""Application configuration using Pydantic Settings"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Marketing Budget Optimizer"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"

    # Authentication / JWT
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Database
    database_url: str = (
        "postgresql://mbo_user:mbo_password_change_me@localhost:5432/marketing_budget_optimizer"
    )

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # RabbitMQ / Celery
    celery_broker_url: str = "amqp://mbo_user:mbo_password_change_me@localhost:5672//"
    celery_result_backend: str = "redis://localhost:6379/1"

    # Anthropic Claude API
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"

    # MCP Server Ports
    mcp_host: str = "localhost"
    mcp_google_ads_port: int = 3001
    mcp_meta_ads_port: int = 3002
    mcp_tiktok_ads_port: int = 3003
    mcp_linkedin_ads_port: int = 3004

    # Google Ads API
    google_ads_developer_token: str = ""
    google_ads_client_id: str = ""
    google_ads_client_secret: str = ""
    google_ads_refresh_token: str = ""
    google_ads_customer_id: str = ""
    google_ads_login_customer_id: str | None = None

    # Meta (Facebook) Ads API
    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_access_token: str = ""
    meta_ad_account_id: str = ""

    # TikTok Ads API
    tiktok_app_id: str = ""
    tiktok_app_secret: str = ""
    tiktok_access_token: str = ""
    tiktok_advertiser_id: str = ""

    # LinkedIn Ads API
    linkedin_client_id: str = ""
    linkedin_client_secret: str = ""
    linkedin_access_token: str = ""
    linkedin_ad_account_id: str = ""

    # Optimization Settings
    confidence_threshold: float = 0.85
    max_budget_reallocation_pct: int = 30
    monitoring_interval_minutes: int = 15
    min_campaign_runtime_hours: int = 72


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()
