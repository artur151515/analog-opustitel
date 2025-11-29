"""
Тестовый роутер для проверки отправки email
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..email_service import send_verification_email
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["test"])


class EmailRequest(BaseModel):
    email: str


@router.post("/test-email")
async def test_email(request: EmailRequest):
    """
    Тестовый endpoint для проверки отправки email
    
    Пример: POST /api/test-email?email=test@example.com
    """
    try:
        email = request.email
        logger.info(f"Testing email send to {email}")
        
        # Генерируем тестовый токен
        test_token = "test-verification-token-12345"
        
        # Отправляем тестовое письмо
        result = await send_verification_email(email, test_token)
        
        if result:
            return {
                "success": True,
                "message": f"Test email sent successfully to {email}",
                "note": "Check logs: tail -f /root/smtp_emails.log"
            }
        else:
            return {
                "success": False,
                "message": "Failed to send email (check backend logs)",
                "note": "Check logs: docker logs visionoftrading-backend"
            }
            
    except Exception as e:
        logger.error(f"Error sending test email: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

