from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    APP_NAME: str = "JobHunt Backend"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    DATABASE_URL: str = "postgresql://postgres:haru@localhost:5432/jobhunt"

    ANTHROPIC_API_KEY: str = ""

    REDIS_URL: str = "redis://localhost:6379/0"

    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    UPLOAD_DIR: str = "./uploads"

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "us-east-1"

    JSEARCH_API_KEY: str = ""
    RAPIDAPI_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
