import resend
from app.core.config import get_settings
from app.core.encryption import decrypt_contact

settings = get_settings()

STATUS_MESSAGES = {
    "acknowledged": {
        "subject": "Your fountain report has been acknowledged",
        "body": "Good news — your fountain report has been acknowledged by city staff. They're aware of the issue and it's in their queue.",
    },
    "in_progress": {
        "subject": "Your fountain report is being worked on",
        "body": "Your fountain report is now in progress. City staff are actively working on fixing the issue.",
    },
    "resolved": {
        "subject": "Your fountain report has been resolved",
        "body": "Your fountain report has been marked as resolved. The issue should now be fixed. If you visit the fountain and it's still broken, you can submit a new report.",
    },
    "stale": {
        "subject": "Your fountain report has been escalated",
        "body": "Your fountain report hasn't received a response within the expected timeframe and has been escalated. We're tracking this to make sure it gets addressed.",
    },
}


def is_email(contact: str) -> bool:
    """Check if the contact string looks like an email."""
    return "@" in contact and "." in contact


async def send_notification(encrypted_contact: str, new_status: str, report_id: str):
    """Send an email notification when a report status changes."""
    if not settings.RESEND_API_KEY:
        print("No RESEND_API_KEY set, skipping notification.")
        return

    if not encrypted_contact:
        return

    # Decrypt the contact info
    contact = decrypt_contact(encrypted_contact)
    if not contact or contact == "[encrypted]":
        return

    # Only send email notifications
    if not is_email(contact):
        return

    # Get the message for this status
    message = STATUS_MESSAGES.get(new_status)
    if not message:
        return

    try:
        resend.api_key = settings.RESEND_API_KEY

        report_url = f"https://opentapwater.com/report/{report_id}"

        html_body = f"""
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1B4F72; margin-bottom: 4px;">OpenTap</h2>
            <p style="color: #888; font-size: 14px; margin-top: 0;">Public Water Fountain Accountability</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">{message['body']}</p>
            <a href="{report_url}" style="display: inline-block; margin-top: 16px; padding: 10px 24px; background: #2E75B6; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">View your report</a>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px;">You received this because you provided your email when submitting a report on OpenTap. We will never share your email.</p>
        </div>
        """

        resend.Emails.send({
            "from": "OpenTap <notifications@resend.dev>",
            "to": [contact],
            "subject": message["subject"],
            "html": html_body,
        })
        print(f"Notification sent to {contact[:3]}*** for status: {new_status}")

    except Exception as e:
        print(f"Failed to send notification: {e}")