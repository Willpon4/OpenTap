from cryptography.fernet import Fernet
from app.core.config import get_settings
import base64
import hashlib

settings = get_settings()


def _get_fernet():
    """Derive a Fernet key from the app's SECRET_KEY."""
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_contact(plaintext: str) -> str:
    """Encrypt a contact string (email or phone)."""
    if not plaintext:
        return plaintext
    f = _get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt_contact(ciphertext: str) -> str:
    """Decrypt a contact string."""
    if not ciphertext:
        return ciphertext
    try:
        f = _get_fernet()
        return f.decrypt(ciphertext.encode()).decode()
    except Exception:
        return "[encrypted]"