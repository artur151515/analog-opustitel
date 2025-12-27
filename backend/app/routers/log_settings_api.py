from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from ..admin_manager import admin_manager
from app.log_settings_manager import log_settings_manager
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/log-settings", tags=["log-settings"])

class LogSettingRequest(BaseModel):
    log_type: str
    enabled: bool
    admin_id: Optional[int] = None

class LogSettingsResponse(BaseModel):
    log_type: str
    display_name: str
    enabled: bool

@router.get("/types")
async def get_log_types():
    """Получить все доступные типы логов"""
    return {
        "types": log_settings_manager.get_log_types()
    }

@router.get("/current")
async def get_current_settings(admin_id: Optional[int] = None):
    """Получить текущие настройки логов для админа"""
    if admin_id and not admin_manager.is_admin(admin_id):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        settings = log_settings_manager.get_all_settings()
        
        return {
            "admin_id": admin_id,
            "settings": settings
        }
    except Exception as e:
        logger.error(f"Error getting log settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/toggle")
async def toggle_log_setting(setting: LogSettingRequest):
    """Включить/выключить тип лога"""
    if setting.admin_id and not admin_manager.is_admin(setting.admin_id):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        result = log_settings_manager.set_log_enabled(
            setting.log_type, 
            setting.enabled, 
            setting.admin_id
        )
        
        if result:
            action = "включено" if setting.enabled else "выключено"
            return {
                "status": "success",
                "message": f"Логирование '{setting.log_type}' {action}",
                "log_type": setting.log_type,
                "enabled": setting.enabled
            }
        else:
            return {
                "status": "error",
                "message": "Failed to update log setting"
            }
    except Exception as e:
        logger.error(f"Error toggling log setting: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/toggle-all")
async def toggle_all_logs(admin_id: Optional[int] = None, enabled: bool = True):
    """Включить/выключить все логи"""
    if admin_id and not admin_manager.is_admin(admin_id):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        result = log_settings_manager.toggle_all_logs(enabled, admin_id)
        
        if result:
            action = "включены" if enabled else "выключены"
            return {
                "status": "success",
                "message": f"Все типы логов {action}",
                "enabled": enabled
            }
        else:
            return {
                "status": "error",
                "message": "Failed to update log settings"
            }
    except Exception as e:
        logger.error(f"Error toggling all logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check/{log_type}")
async def check_log_enabled(log_type: str, admin_id: Optional[int] = None):
    """Проверить включен ли конкретный тип лога"""
    try:
        enabled = log_settings_manager.is_log_enabled(log_type, admin_id)
        
        return {
            "log_type": log_type,
            "enabled": enabled
        }
    except Exception as e:
        logger.error(f"Error checking log enabled: {e}")
        raise HTTPException(status_code=500, detail=str(e))