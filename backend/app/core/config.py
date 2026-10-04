from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings and configuration loaded from environment variables."""

    PROJECT_NAME: str = "Mirror Check API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Gemini API Configuration
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key")
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash", description="Gemini model identifier")
    GEMINI_TIMEOUT_SECONDS: float = Field(default=15.0, description="Timeout for Gemini API requests in seconds")

    # Security & CORS
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        description="Comma-separated list of allowed CORS origins",
    )

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: str = Field(default="60/minute", description="Rate limit per client IP")

    # Cache Settings
    CACHE_TTL_SECONDS: int = Field(default=300, description="TTL in seconds for cache")
    CACHE_MAX_ITEMS: int = Field(default=500, description="Maximum items in in-memory cache")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list of cleaned strings."""
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
