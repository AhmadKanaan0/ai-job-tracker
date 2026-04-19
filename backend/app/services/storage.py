"""
Storage service — save/retrieve files locally or from S3.
Switch via STORAGE_BACKEND env var.
"""
import os
import uuid
from pathlib import Path
from app.core.config import settings


def save_file(file_bytes: bytes, filename: str) -> str:
    """Save file and return its URL/path."""
    if settings.STORAGE_BACKEND == "s3":
        return _save_s3(file_bytes, filename)
    return _save_local(file_bytes, filename)


def _save_local(file_bytes: bytes, filename: str) -> str:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Use UUID prefix to avoid filename collisions
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = upload_dir / unique_name
    file_path.write_bytes(file_bytes)
    return str(file_path)


def _save_s3(file_bytes: bytes, filename: str) -> str:
    import boto3
    from botocore.exceptions import BotoCoreError

    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    key = f"cvs/{uuid.uuid4().hex}_{filename}"
    s3.put_object(Bucket=settings.AWS_S3_BUCKET, Key=key, Body=file_bytes)
    return f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
