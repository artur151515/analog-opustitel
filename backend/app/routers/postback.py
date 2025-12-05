from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import json
import logging

from ..db import get_db
from ..models import User, PostbackLog
from ..config import settings
from ..telegram_bot import telegram_bot

router = APIRouter(prefix="/api/postback", tags=["postback"])
logger = logging.getLogger(__name__)

@router.post("/pocket-partners")
@router.get("/pocket-partners")
async def handle_pocket_partners_postback(
    request: Request,
    db: Session = Depends(get_db),
    # Параметры постбека от Pocket Partners
    event: Optional[str] = None,  # Тип события
    trader_id: Optional[str] = None,  # ID трейдера
    click_id: Optional[str] = None,  # ID клика (наш user ID)
    site_id: Optional[str] = None,  # ID сайта
    cid: Optional[str] = None,  # ID кампании
    ac: Optional[str] = None,  # Название кампании
    sub_id1: Optional[str] = None,
    sub_id2: Optional[str] = None,
    sub_id3: Optional[str] = None,
    sub_id4: Optional[str] = None,
    sub_id5: Optional[str] = None,
    country: Optional[str] = None,
    device_type: Optional[str] = None,
    os_version: Optional[str] = None,
    browser: Optional[str] = None,
    promo: Optional[str] = None,
    link_type: Optional[str] = None,
    date_time: Optional[str] = None,
    sumdep: Optional[float] = None,  # Сумма депозита
    wdr_sum: Optional[float] = None,  # Сумма вывода
    status: Optional[str] = None,  # Статус вывода
    commission: Optional[float] = None,  # Комиссия
):
    """
    Обработка постбеков от Pocket Partners
    
    События:
    - reg: Регистрация трейдера
    - email: Подтверждение email
    - ftd: Первый депозит
    - dep: Повторный депозит
    - commission: Комиссия
    - wdr: Вывод средств
    """
    
    # Получаем все параметры запроса
    query_params = dict(request.query_params)
    
    logger.info(f"Received postback: event={event}, trader_id={trader_id}, click_id={click_id}")
    logger.info(f"Full params: {query_params}")
    
    # Находим пользователя
    user = None
    if click_id:
        # click_id может быть либо user_id, либо pocket_option_id
        try:
            user_id = int(click_id)
            user = db.query(User).filter(User.id == user_id).first()
        except ValueError:
            # Если не число, ищем по pocket_option_id
            user = db.query(User).filter(User.pocket_option_id == click_id).first()
    
    if not user and trader_id:
        # Ищем по trader_id (это pocket_option_id)
        user = db.query(User).filter(User.pocket_option_id == trader_id).first()
    
    # Создаем лог постбека
    postback_log = PostbackLog(
        user_id=user.id if user else None,
        event_type=event or "unknown",
        trader_id=trader_id,
        click_id=click_id,
        deposit_sum=sumdep or 0.0,
        withdrawal_sum=wdr_sum or 0.0,
        commission=commission or 0.0,
        withdrawal_status=status,
        country=country,
        device_type=device_type,
        os_version=os_version,
        browser=browser,
        promo_code=promo,
        landing_type=link_type,
        campaign_id=cid,
        campaign_name=ac,
        raw_data=json.dumps(query_params),
        event_datetime=datetime.fromisoformat(date_time) if date_time else datetime.utcnow(),
    )
    
    db.add(postback_log)
    
    # Обрабатываем событие
    if user:
        if event == "reg":
            # Регистрация - связываем trader_id с пользователем
            if trader_id and not user.pocket_option_id:
                user.pocket_option_id = trader_id
                user.pocket_option_verified = True
                logger.info(f"User {user.id} linked to trader_id {trader_id}")
                
                # Отправляем уведомление
                await telegram_bot.notify_postback_received(
                    event_type="POSTBACK_REG",
                    user_email=user.email,
                    trader_id=trader_id or "",
                    amount=0.0
                )
        
        elif event == "ftd":
            # Первый депозит
            if sumdep:
                user.pocket_option_balance = (user.pocket_option_balance or 0.0) + sumdep
                user.has_min_deposit = user.pocket_option_balance >= 10
                logger.info(f"User {user.id} FTD: {sumdep}, new balance: {user.pocket_option_balance}")
                
                # Отправляем уведомление
                await telegram_bot.notify_postback_received(
                    event_type="POSTBACK_FTD",
                    user_email=user.email,
                    trader_id=trader_id or "",
                    amount=sumdep or 0.0
                )
        
        elif event == "dep":
            # Повторный депозит
            if sumdep:
                user.pocket_option_balance = (user.pocket_option_balance or 0.0) + sumdep
                user.has_min_deposit = user.pocket_option_balance >= 10
                logger.info(f"User {user.id} deposit: {sumdep}, new balance: {user.pocket_option_balance}")
                
                # Отправляем уведомление
                await telegram_bot.notify_postback_received(
                    event_type="POSTBACK_DEP",
                    user_email=user.email,
                    trader_id=trader_id or "",
                    amount=sumdep or 0.0
                )
        
        elif event == "wdr":
            # Вывод - уменьшаем баланс если обработан
            if wdr_sum and status == "processed":
                user.pocket_option_balance = max(0, (user.pocket_option_balance or 0.0) - wdr_sum)
                user.has_min_deposit = user.pocket_option_balance >= 10
                logger.info(f"User {user.id} withdrawal: {wdr_sum}, new balance: {user.pocket_option_balance}")
                
                # Отправляем уведомление
                await telegram_bot.notify_postback_received(
                    event_type="POSTBACK_WDR",
                    user_email=user.email,
                    trader_id=trader_id or "",
                    amount=wdr_sum or 0.0
                )
        
        elif event == "commission":
            # Комиссия
            if commission:
                # Отправляем уведомление
                await telegram_bot.notify_postback_received(
                    event_type="POSTBACK_COMMISSION",
                    user_email=user.email,
                    trader_id=trader_id or "",
                    amount=commission or 0.0
                )
        
        db.commit()
    
    return {
        "status": "ok",
        "message": "Postback received",
        "user_found": user is not None,
        "event": event
    }


@router.get("/logs")
async def get_postback_logs(
    skip: int = 0,
    limit: int = 50,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получить логи постбеков (для админов)"""
    query = db.query(PostbackLog).order_by(PostbackLog.received_at.desc())
    
    if event_type:
        query = query.filter(PostbackLog.event_type == event_type)
    
    total = query.count()
    logs = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "logs": [
            {
                "id": log.id,
                "event_type": log.event_type,
                "trader_id": log.trader_id,
                "user_id": log.user_id,
                "deposit_sum": log.deposit_sum,
                "commission": log.commission,
                "received_at": log.received_at.isoformat(),
            }
            for log in logs
        ]
    }

