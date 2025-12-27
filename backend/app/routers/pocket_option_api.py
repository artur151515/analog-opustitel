from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from ..db import get_db
from ..models.user import User
from .auth import get_current_user
from ..activity_logger import log_balance_update
from typing import Optional
import requests
import logging

router = APIRouter(prefix="/pocket-option", tags=["pocket-option"])
logger = logging.getLogger(__name__)

@router.get("/check-balance-external/{pocket_option_id}")
async def check_balance_external(
    pocket_option_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Проверка баланса пользователя в Pocket Option через реальный API
    """
    try:
        # Обращение к API Pocket Option для проверки баланса
        api_url = f"https://pocketoptions.com/api/balance/{pocket_option_id}"
        
        logger.info(f"Checking balance for Pocket Option ID: {pocket_option_id}")
        
        response = requests.get(
            api_url,
            headers={
                "User-Agent": "VisionOfTrading/1.0",
                "Accept": "application/json"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            balance_data = response.json()
            logger.info(f"Successfully retrieved balance: {balance_data}")
        else:
            logger.error(f"API returned status {response.status_code}: {response.text}")
            raise Exception(f"Pocket Option API returned status {response.status_code}")

        # Обновляем баланс в базе данных
        balance_value = float(balance_data.get("balance", 0.0))
        
        # Исправляем проблемы с типами через setattr
        setattr(current_user, 'pocket_option_balance', balance_value)
        
        # Проверяем минимальный депозит
        if balance_value >= 10.0:
            setattr(current_user, 'has_min_deposit', True)
            
        db.commit()

        return {
            "status": "success",
            "balance": balance_value,
            "currency": balance_data.get("currency", "USD"),
            "last_updated": balance_data.get("last_updated"),
            "pocket_option_id": pocket_option_id
        }

    except requests.exceptions.RequestException as e:
        logger.error(f"Network error checking balance: {e}")
        raise HTTPException(status_code=503, detail="Failed to connect to Pocket Option API")
    except Exception as e:
        logger.error(f"Error checking balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))