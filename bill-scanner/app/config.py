from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://receipt:receipt@localhost:5432/receipts"
    VECTOR_DATA_PATH: str = "/vector_data"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    VECTOR_DIMENSION: int = 384
    HDBSCAN_MIN_CLUSTER_SIZE: int = 5
    CLUSTERING_INTERVAL_HOURS: int = 6
    MAX_UPLOAD_SIZE_MB: int = 10

    # OpenRouter API
    OPENROUTER_API_KEY: str = "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"
    OPENROUTER_URL: str = "https://openrouter.ai/api/v1/chat/completions"
    OPENROUTER_MODEL: str = "nvidia/nemotron-3-super-120b-a12b:free"

    class Config:
        env_file = ".env"

settings = Settings()
