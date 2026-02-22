from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "LegacyLink API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    DATABASE_URL: str = "postgresql://legacylink:legacylink_secret@postgres:5432/legacylink"
    REDIS_URL: str = "redis://redis:6379"
    
    OPENAI_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None
    
    DEMO_MODE: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
