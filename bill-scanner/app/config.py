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

    class Config:
        env_file = ".env"

settings = Settings()
