import uuid
import boto3
from botocore.config import Config
from app.core.config import get_settings

settings = get_settings()


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def upload_file_to_r2(file_bytes: bytes, content_type: str = "image/jpeg"):
    """Upload a file directly to R2 from the backend."""
    client = get_r2_client()
    file_id = uuid.uuid4().hex[:12]
    ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
    key = f"photos/{file_id}.{ext}"

    client.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )

    public_url = f"{settings.R2_PUBLIC_URL}/{key}"

    return {
        "photo_url": public_url,
        "key": key,
    }