import bleach
import re


def sanitize_text(text: str, max_length: int = 2000) -> str:
    """Strip all HTML tags and limit length."""
    if not text:
        return text
    # Remove all HTML tags
    cleaned = bleach.clean(text, tags=[], strip=True)
    # Remove any remaining angle brackets
    cleaned = re.sub(r'[<>]', '', cleaned)
    # Collapse excessive whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    # Enforce max length
    return cleaned[:max_length]


def sanitize_contact(contact: str) -> str:
    """Sanitize contact info — allow only safe characters."""
    if not contact:
        return contact
    # Strip HTML
    cleaned = bleach.clean(contact, tags=[], strip=True)
    # Only allow alphanumeric, @, ., +, -, _, spaces, parentheses
    cleaned = re.sub(r'[^a-zA-Z0-9@.\+\-_\s\(\)]', '', cleaned)
    return cleaned[:255]