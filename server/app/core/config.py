from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # MongoDB settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "nirf_recommendation"
    
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "NIRF Recommendation System"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()