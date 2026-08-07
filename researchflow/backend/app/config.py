from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    # LLM provider settings
    LLM_PROVIDER: str = "groq"
    GROQ_API_KEY: str | None = None
    # Default model: Groq Llama 3.1 8B Instant (free tier, good quality for reports)
    LLM_MODEL: str = "llama-3.1-8b-instant"

    # Optional: SambaNova key retained for future use
    SAMBANOVA_API_KEY: str | None = None

    # Optional: Tavily API key – used for web search (falls back to DuckDuckGo)
    TAVILY_API_KEY: str = ""

    # Database
    MONGODB_URL: str
    DATABASE_NAME: str = "researchflow"

    # Server / frontend
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    FRONTEND_URL: str = "http://localhost:5173"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()