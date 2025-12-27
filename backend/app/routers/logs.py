from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from ..db import get_db
from ..models import User
from .auth import get_current_user

router = APIRouter(prefix="/api/logs", tags=["logs"])

# ActivityLogResponse class removed - database logging disabled

@router.get("/")
async def get_activity_logs():
    """Логи активности отключены - используется только Telegram бот"""
    return {"message": "Database logging disabled. Check Telegram bot for notifications."}

@router.get("/stats")
async def get_logs_stats():
    """Статистика логов отключена - используется только Telegram бот"""
    return {"message": "Database logging disabled. Check Telegram bot for notifications."}

@router.delete("/{log_id}")
async def delete_log():
    """Удаление логов отключено - используется только Telegram бот"""
    return {"message": "Database logging disabled. Check Telegram bot for notifications."}