from fastapi import APIRouter, Request
from app.telegram_bot import telegram_bot
from app.admin_manager import admin_manager
import json

router = APIRouter(prefix="/test", tags=["test"])

@router.post("/telegram_message")
async def test_telegram_message(request: Request):
    """Тестовый эндпоинт для отправки сообщения в Telegram"""
    try:
        data = await request.json()
        message = data.get("message", "Test message")
        
        # Отправляем в общий чат
        result = await telegram_bot.send_message(f"🧪 TEST: {message}")
        
        return {"status": "sent", "result": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/admin_info")
async def test_admin_info():
    """Получаем информацию об админах"""
    try:
        admin_ids = admin_manager.load_admins()
        return {
            "admin_count": len(admin_ids),
            "admin_ids": admin_ids,
            "pending_auth": len(admin_manager.pending_auth)
        }
    except Exception as e:
        return {"error": str(e)}

@router.post("/add_admin")
async def test_add_admin(request: Request):
    """Добавляем тестового админа"""
    try:
        data = await request.json()
        user_id = data.get("user_id")
        
        if user_id:
            result = admin_manager.add_admin(user_id)
            return {"status": "added", "user_id": user_id, "result": result}
        else:
            return {"error": "user_id required"}
    except Exception as e:
        return {"error": str(e)}