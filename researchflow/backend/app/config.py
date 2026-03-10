from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    SAMBANOVA_API_KEY: str
    TAVILY_API_KEY: str = ""  # optional – falls back to DuckDuckGo when empty
    MONGODB_URL: str
    DATABASE_NAME: str = "researchflow"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    FRONTEND_URL: str = "http://localhost:5173"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
