from fastapi import Request
from app.models.user import User
from app.telegram_bot import telegram_bot
from app.log_settings_manager import log_settings_manager
from datetime import datetime
import asyncio
from typing import Optional


async def log_user_login(db, user: User, request: Request):
    if not log_settings_manager.is_log_enabled("USER_LOGIN"):
        return
        
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "") if request else ""
    
    print(f"LOGIN: {user.email} from {client_ip} with {user_agent[:50]}...")
    await telegram_bot.notify_user_login(str(user.email), client_ip, user_agent)


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"


async def log_balance_update(db, user: User, old_balance: float, new_balance: float, amount: float):
    if not log_settings_manager.is_log_enabled("BALANCE_UPDATE"):
        return
        
    print(f"BALANCE UPDATE: {user.email} +${amount:.2f}")
    await telegram_bot.notify_balance_update(str(user.email), old_balance, new_balance, amount)


async def log_important_action(db, user: Optional[User] = None, action_type: str = "", description: str = ""):
    if not log_settings_manager.is_log_enabled("IMPORTANT_ACTION"):
        return
        
    user_email = str(user.email) if user else ""
    print(f"ACTION: {action_type} - {description} by {user_email}")
    await telegram_bot.notify_important_action(action_type, description, user_email)


async def log_visitor(ip: str, user_agent: str, device_info: dict, path: str):
    if not log_settings_manager.is_log_enabled("VISITOR"):
        return
        
    print(f"VISITOR: {ip} - {device_info.get('type', 'Unknown')} ({device_info.get('browser', 'Unknown')}/{device_info.get('os', 'Unknown')}) - {path}")
    await telegram_bot.notify_visitor(ip, user_agent, device_info, path)