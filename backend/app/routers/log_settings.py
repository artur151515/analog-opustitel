from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from ..db import get_db
from ..admin_manager import admin_manager
from app.models.log_settings import LogSettings, LogType
from ..telegram_bot import telegram_bot
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/log-settings", tags=["log-settings"])

class LogSettingRequest(BaseModel):
    log_type: str
    enabled: bool

class LogSettingsResponse(BaseModel):
    log_type: str
    display_name: str
    enabled: bool

@router.get("/types")
async def get_log_types():
    """Получить все доступные типы логов"""
    return {
        "types": [
            {
                "type": log_type,
                "display_name": LogType.get_display_name(log_type)
            }
            for log_type in LogType.all_types()
        ]
    }

@router.get("/current")
async def get_current_settings(
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Получить текущие настройки логов для админа"""
    if not admin_manager.is_admin(admin_id):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        settings = db.query(LogSettings).filter(
            LogSettings.admin_id == admin_id
        ).all()
        
        result = {}
        for setting in settings:
            result[setting.log_type] = setting.enabled
        
        # Заполняем отсутствующие настройки по умолчанию
        for log_type in LogType.all_types():
            if log_type not in result:
                result[log_type] = True
        
        return {
            "admin_id": admin_id,
            "settings": [
                {
                    "log_type": log_type,
                    "display_name": LogType.get_display_name(log_type),
                    "enabled": result.get(log_type, True)
                }
                for log_type in LogType.all_types()
            ]
        }
    except Exception as e:
        logger.error(f"Error getting log settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/toggle")
async def toggle_log_setting(
    admin_id: int,
    setting: LogSettingRequest,
    db: Session = Depends(get_db)
):
    """Включить/выключить тип лога"""
    if not admin_manager.is_admin(admin_id):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if setting.log_type not in LogType.all_types():
        raise HTTPException(status_code=400, detail="Invalid log type")
    
    try:
        existing = db.query(LogSettings).filter(
            LogSettings.admin_id == admin_id,
            LogSettings.log_type == setting.log_type
        ).first()
        
        if existing:
            existing.enabled = setting.enabled
            existing.updated_at = datetime.utcnow()
        else:
            new_setting = LogSettings(
                admin_id=admin_id,
                log_type=setting.log_type,
                enabled=setting.enabled
            )
            db.add(new_setting)
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Логирование '{LogType.get_display_name(setting.log_type)}' {'включено' if setting.enabled else 'выключено'}",
            "log_type": setting.log_type,
            "enabled": setting.enabled
        }
    except Exception as e:
        logger.error(f"Error toggling log setting: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/toggle-all")
async def toggle_all_logs(
    admin_id: int,
    enabled: bool,
    db: Session = Depends(get_db)
):
    """Включить/выключить все логи"""
    if not admin_manager.is_admin(admin_id):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        for log_type in LogType.all_types():
            existing = db.query(LogSettings).filter(
                LogSettings.admin_id == admin_id,
                LogSettings.log_type == log_type
            ).first()
            
            if existing:
                existing.enabled = enabled
                existing.updated_at = datetime.utcnow()
            else:
                new_setting = LogSettings(
                    admin_id=admin_id,
                    log_type=log_type,
                    enabled=enabled
                )
                db.add(new_setting)
        
        db.commit()
        
        action = "включены" if enabled else "выключены"
        return {
            "status": "success",
            "message": f"Все типы логов {action}",
            "enabled": enabled
        }
    except Exception as e:
        logger.error(f"Error toggling all logs: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check/{log_type}")
async def check_log_enabled(
    log_type: str,
    admin_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Проверить включен ли конкретный тип лога"""
    if log_type not in LogType.all_types():
        raise HTTPException(status_code=400, detail="Invalid log type")
    
    try:
        # Если указан admin_id, проверяем его настройки
        if admin_id:
            if not admin_manager.is_admin(admin_id):
                raise HTTPException(status_code=403, detail="Admin access required")
            
            setting = db.query(LogSettings).filter(
                LogSettings.admin_id == admin_id,
                LogSettings.log_type == log_type
            ).first()
            
            enabled = setting.enabled if setting else True
        else:
            # Иначе проверяем включен ли лог хотя бы у одного админа
            setting = db.query(LogSettings).filter(
                LogSettings.log_type == log_type,
                LogSettings.enabled == True
            ).first()
            
            enabled = setting is not None
        
        return {
            "log_type": log_type,
            "display_name": LogType.get_display_name(log_type),
            "enabled": enabled
        }
    except Exception as e:
        logger.error(f"Error checking log enabled: {e}")
        raise HTTPException(status_code=500, detail=str(e))