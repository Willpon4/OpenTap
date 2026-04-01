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


def generate_presigned_upload_url(report_id: str = None, content_type: str = "image/jpeg"):
    """Generate a pre-signed URL for direct browser upload to R2."""
    client = get_r2_client()
    file_id = uuid.uuid4().hex[:12]
    prefix = f"reports/{report_id}" if report_id else "uploads"
    key = f"{prefix}/{file_id}.jpg"

    url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.R2_BUCKET_NAME,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=600,  # 10 minutes
    )

    public_url = f"{settings.R2_PUBLIC_URL}/{key}"

    return {
        "upload_url": url,
        "public_url": public_url,
        "key": key,
    }