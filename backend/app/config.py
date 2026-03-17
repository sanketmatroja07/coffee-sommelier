from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://sommelier:sommelier@db:5432/sommelier"
    admin_user: str = "admin"
    admin_password: str = "changeme"
    widget_secret: str = "widget-secret-change-in-prod"
    llm_api_key: str | None = None
    llm_base_url: str | None = None
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:4173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:8080"
    jwt_secret: str = "change-me-in-production-use-strong-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days
    rate_limit_per_minute: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
