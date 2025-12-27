from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from app.telegram_bot import telegram_bot
from app.admin_manager import admin_manager
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telegram", tags=["telegram"])

@router.post("/webhook")
async def telegram_webhook(request: Request):
    try:
        update = await request.json()
        
        result = await telegram_bot.handle_webhook(update)
        
        if result:
            return JSONResponse({"status": "ok"})
        else:
            return JSONResponse({"status": "error"}, status_code=400)
            
    except Exception as e:
        logger.error(f"Error in telegram webhook: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

@router.get("/info")
async def get_telegram_info():
    try:
        admin_ids = admin_manager.load_admins()
        
        return {
            "bot_status": "active",
            "admin_count": len(admin_ids),
            "admin_ids": admin_ids,
            "pending_auth": len(admin_manager.pending_auth)
        }
    except Exception as e:
        logger.error(f"Error getting telegram info: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@router.post("/set_webhook")
async def set_webhook(request: Request):
    try:
        data = await request.json()
        webhook_url = data.get("webhook_url")
        
        if not webhook_url:
            raise HTTPException(status_code=400, detail="webhook_url is required")
        
        result = await telegram_bot.set_webhook(webhook_url)
        
        if result:
            return JSONResponse({"status": "webhook set successfully"})
        else:
            return JSONResponse({"status": "failed to set webhook"}, status_code=500)
            
    except Exception as e:
        logger.error(f"Error setting webhook: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@router.get("/admins")
async def get_admins():
    try:
        admin_ids = admin_manager.load_admins()
        return {
            "admin_ids": admin_ids,
            "count": len(admin_ids)
        }
    except Exception as e:
        logger.error(f"Error getting admins: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@router.delete("/admins/{admin_id}")
async def remove_admin(admin_id: int):
    try:
        result = admin_manager.remove_admin(admin_id)
        
        if result:
            return JSONResponse({"status": "admin removed successfully"})
        else:
            return JSONResponse({"status": "failed to remove admin"}, status_code=500)
            
    except Exception as e:
        logger.error(f"Error removing admin: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@router.get("/settings")
async def get_log_settings():
    """Получить настройки логирования"""
    try:
        from app.log_settings_manager import log_settings_manager
        settings = log_settings_manager.get_all_settings()
        
        return {
            "status": "success",
            "settings": settings
        }
    except Exception as e:
        logger.error(f"Error getting log settings: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@router.post("/settings/toggle")
async def toggle_log_setting(request: Request):
    """Переключить настройки логирования"""
    try:
        from app.log_settings_manager import log_settings_manager
        data = await request.json()
        log_type = data.get("log_type")
        enabled = data.get("enabled")
        admin_id = data.get("admin_id")
        
        if log_type and enabled is not None:
            result = log_settings_manager.set_log_enabled(log_type, enabled, admin_id)
            
            if result:
                action = "включено" if enabled else "выключено"
                return JSONResponse({
                    "status": "success",
                    "message": f"Логирование '{log_type}' {action}"
                })
            else:
                return JSONResponse({
                    "status": "error",
                    "message": "Failed to update log setting"
                }, status_code=500)
        else:
            return JSONResponse({
                "status": "error",
                "message": "Missing log_type or enabled parameter"
            }, status_code=400)
            
    except Exception as e:
        logger.error(f"Error toggling log setting: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)