from fastapi import APIRouter, HTTPException, Depends, status, Request, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..models.user import User
from .auth import get_current_user
from typing import Optional
import requests
import logging

router = APIRouter(prefix="/pocket-option", tags=["pocket-option"])
logger = logging.getLogger(__name__)

@router.post("/postback")
async def pocket_option_postback(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Обработка постбека от Pocket Option (POST)
    """
    try:
        # Пытаемся получить JSON данные
        try:
            data = await request.json()
            logger.info(f"Received Pocket Option POST postback (JSON): {data}")
        except:
            # Если не JSON, получаем form data
            form_data = await request.form()
            data = dict(form_data)
            logger.info(f"Received Pocket Option POST postback (FORM): {data}")

        # Извлекаем данные из постбека
        # Проверяем формат Pocket Option (GET параметры в POST)
        if "click_id" in data or "reg" in data or "conf" in data or "ftd" in data or "dep" in data:
            # Pocket Option формат
            click_id = data.get("click_id")
            site_id = data.get("site_id")
            trader_id = data.get("trader_id")
            sumdep = data.get("sumdep")  # Сумма депозита
            totaldep = data.get("totaldep")  # Общая сумма депозитов
            reg = data.get("reg")
            conf = data.get("conf")
            ftd = data.get("ftd")
            dep = data.get("dep")
            a = data.get("a")
            ac = data.get("ac")

            logger.info(f"Postback params - click_id: {click_id}, site_id: {site_id}, trader_id: {trader_id}, sumdep: {sumdep}, totaldep: {totaldep}")

            # Определяем действие (поддерживаем и "1"/"0" и "true"/"false")
            action = None
            if reg in ["1", "true"]:
                action = "registration"
            elif conf in ["1", "true"]:
                action = "email_confirmed"
            elif ftd in ["1", "true"]:
                action = "first_deposit"
            elif dep in ["1", "true"]:
                action = "deposit"

            if not action:
                logger.warning(f"No valid action found in POST postback: {data}")
                return {"status": "ignored", "message": "No valid action"}

            # Ищем пользователя по click_id или trader_id
            user = None

            if click_id:
                user = db.query(User).filter(User.pocket_option_id == click_id).first()
                logger.info(f"Searching by click_id: {click_id}")

            if not user and trader_id:
                user = db.query(User).filter(User.pocket_option_id == trader_id).first()
                logger.info(f"Searching by trader_id: {trader_id}")

            if not user:
                logger.warning(f"User not found for click_id: {click_id}, trader_id: {trader_id}")
                return {"status": "ignored", "message": f"User not found for click_id: {click_id}, trader_id: {trader_id}"}

            # Обновляем данные пользователя
            if action == "registration":
                user.pocket_option_verified = True
                # Если пришел trader_id, сохраняем его тоже (это ID в Pocket Option)
                if trader_id and not user.pocket_option_id:
                    user.pocket_option_id = trader_id
                logger.info(f"User {user.id} registered with Pocket Option, trader_id: {trader_id}")

            elif action == "email_confirmed":
                user.is_verified = True
                logger.info(f"User {user.id} email confirmed")

            elif action in ["first_deposit", "deposit"]:
                user.has_min_deposit = True

                # Сохраняем сумму депозита и общую сумму
                if sumdep:
                    try:
                        sum_deposit = float(sumdep)
                        logger.info(f"Deposit amount: {sum_deposit}")
                    except (ValueError, TypeError):
                        logger.warning(f"Invalid sumdep value: {sumdep}")

                if totaldep:
                    try:
                        total_deposit = float(totaldep)
                        user.pocket_option_balance = total_deposit
                        logger.info(f"Total deposit/balance: {total_deposit}")

                        # Проверяем минимальный депозит (>= 10 USD)
                        if total_deposit >= 10.0:
                            user.has_min_deposit = True
                    except (ValueError, TypeError):
                        logger.warning(f"Invalid totaldep value: {totaldep}")

                logger.info(f"User {user.id} made {action}, sumdep: {sumdep}, totaldep: {totaldep}")

            db.commit()
            return {"status": "success", "message": f"{action} processed successfully"}

        else:
            # Стандартный JSON формат
            user_id = data.get("user_id")
            pocket_option_id = data.get("pocket_option_id")
            action = data.get("action")  # registration, deposit, trade, etc.
            amount = data.get("amount", 0)
            balance = data.get("balance", 0)

        if not user_id or not pocket_option_id:
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: user_id, pocket_option_id"
            )

        # Находим пользователя
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # Обновляем данные пользователя
        if action == "registration":
            user.pocket_option_id = pocket_option_id
            user.pocket_option_verified = True
            logger.info(f"User {user_id} registered with Pocket Option ID: {pocket_option_id}")

        elif action == "deposit":
            user.pocket_option_balance = balance
            # Проверяем минимальный депозит (>= 10 USD)
            if balance >= 10.0:
                user.has_min_deposit = True
            logger.info(f"User {user_id} deposited {amount}, new balance: {balance}")

        elif action == "trade":
            user.pocket_option_balance = balance
            logger.info(f"User {user_id} traded, new balance: {balance}")

        db.commit()

        return {"status": "success", "message": "Postback processed successfully"}

    except Exception as e:
        logger.error(f"Error processing postback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/postback")
async def pocket_option_get_postback(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Обработка GET постбека от Pocket Option (стандартный формат)
    """
    try:
        # Получаем все query параметры
        params = dict(request.query_params)
        logger.info(f"Received Pocket Option GET postback: {params}")

        # Извлекаем данные из параметров
        click_id = params.get("click_id")
        site_id = params.get("site_id")
        trader_id = params.get("trader_id")
        sumdep = params.get("sumdep")  # Сумма депозита
        totaldep = params.get("totaldep")  # Общая сумма депозитов
        reg = params.get("reg")
        conf = params.get("conf")
        ftd = params.get("ftd")
        dep = params.get("dep")
        a = params.get("a")
        ac = params.get("ac")

        logger.info(f"GET Postback params - click_id: {click_id}, site_id: {site_id}, trader_id: {trader_id}, sumdep: {sumdep}, totaldep: {totaldep}")

        # Определяем действие на основе параметров (поддерживаем и "1"/"0" и "true"/"false")
        action = None
        if reg in ["1", "true"]:
            action = "registration"
        elif conf in ["1", "true"]:
            action = "email_confirmed"
        elif ftd in ["1", "true"]:
            action = "first_deposit"
        elif dep in ["1", "true"]:
            action = "deposit"

        if not action:
            logger.warning(f"No valid action found in postback: {params}")
            return {"status": "ignored", "message": "No valid action"}

        # Ищем пользователя по click_id или trader_id
        user = None
        if click_id:
            user = db.query(User).filter(User.pocket_option_id == click_id).first()
            logger.info(f"Searching by click_id: {click_id}")

        if not user and trader_id:
            user = db.query(User).filter(User.pocket_option_id == trader_id).first()
            logger.info(f"Searching by trader_id: {trader_id}")

        if not user:
            logger.warning(f"User not found for click_id: {click_id}, trader_id: {trader_id}")
            return {"status": "ignored", "message": "User not found"}

        # Обновляем данные пользователя
        if action == "registration":
            user.pocket_option_verified = True
            # Если пришел trader_id, сохраняем его тоже (это ID в Pocket Option)
            if trader_id and not user.pocket_option_id:
                user.pocket_option_id = trader_id
            logger.info(f"User {user.id} registered with Pocket Option, trader_id: {trader_id}")

        elif action == "email_confirmed":
            user.is_verified = True
            logger.info(f"User {user.id} email confirmed")

        elif action in ["first_deposit", "deposit"]:
            user.has_min_deposit = True

            # Сохраняем сумму депозита и общую сумму
            if sumdep:
                try:
                    sum_deposit = float(sumdep)
                    logger.info(f"Deposit amount: {sum_deposit}")
                except (ValueError, TypeError):
                    logger.warning(f"Invalid sumdep value: {sumdep}")

            if totaldep:
                try:
                    total_deposit = float(totaldep)
                    user.pocket_option_balance = total_deposit
                    logger.info(f"Total deposit/balance: {total_deposit}")

                    # Проверяем минимальный депозит (>= 10 USD)
                    if total_deposit >= 10.0:
                        user.has_min_deposit = True
                except (ValueError, TypeError):
                    logger.warning(f"Invalid totaldep value: {totaldep}")

            logger.info(f"User {user.id} made {action}, sumdep: {sumdep}, totaldep: {totaldep}")

        db.commit()

        return {"status": "success", "message": f"{action} processed successfully"}

    except Exception as e:
        logger.error(f"Error processing GET postback: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/verify-pocket-option")
async def verify_pocket_option(
    pocket_option_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Верификация Pocket Option ID пользователя

    Проверяет что:
    1. С таким ID был постбэк от Pocket Option
    2. Этот ID не используется другим пользователем
    """
    try:
        if not pocket_option_id:
            raise HTTPException(
                status_code=400,
                detail="Pocket Option ID is required"
            )
        # Проверяем, был ли постбэк с таким pocket_option_id
        # Ищем любого пользователя с этим ID, у которого был постбэк
        user_with_postback = db.query(User).filter(
            User.pocket_option_id == pocket_option_id
        ).first()

        if not user_with_postback:
            logger.warning(f"No postback received for Pocket Option ID: {pocket_option_id}")
            raise HTTPException(
                status_code=400,
                detail="No postback received from Pocket Option for this ID. Please register with Pocket Option first."
            )

        # Проверяем, что этот ID принадлежит текущему пользователю или что у него еще нет ID
        if user_with_postback.id != current_user.id:
            logger.warning(f"Pocket Option ID {pocket_option_id} already belongs to user {user_with_postback.id}")
            raise HTTPException(
                status_code=400,
                detail="This Pocket Option ID is already registered by another user"
            )

        # Если все проверки пройдены, подтверждаем верификацию
        current_user.pocket_option_verified = True

        db.commit()

        logger.info(f"User {current_user.id} verified with Pocket Option ID: {pocket_option_id}")

        return {
            "status": "success",
            "message": "Pocket Option ID verified successfully",
            "pocket_option_id": pocket_option_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying Pocket Option ID: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-balance/{pocket_option_id}")
async def check_balance(
    pocket_option_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Проверка баланса пользователя в Pocket Option
    """
    try:
        # Здесь должна быть логика обращения к табличке на Pocket Option
        # Пока что возвращаем моковые данные

        # Пример обращения к внешней табличке
        # response = requests.get(f"https://pocketoptions.com/api/balance/{pocket_option_id}")
        # balance_data = response.json()

        # Моковые данные для демонстрации
        balance_data = {
            "balance": 250.75,
            "currency": "USD",
            "last_updated": "2024-01-15T10:30:00Z",
            "status": "active"
        }

        # Обновляем баланс в базе данных
        current_user.pocket_option_balance = balance_data["balance"]
        db.commit()

        return {
            "status": "success",
            "balance": balance_data["balance"],
            "currency": balance_data["currency"],
            "pocket_option_id": pocket_option_id
        }

    except Exception as e:
        logger.error(f"Error checking balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulate-postback")
async def simulate_postback(
    user_id: int,
    action: str,
    amount: Optional[float] = None,
    balance: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Симуляция постбека для тестирования
    """
    try:
        postback_data = {
            "user_id": user_id,
            "pocket_option_id": f"PO{user_id:06d}",
            "action": action,
            "amount": amount or 0,
            "balance": balance or 100.0
        }

        # Вызываем обработчик постбека
        result = await pocket_option_postback(postback_data, db)

        return {
            "status": "success",
            "message": "Postback simulated successfully",
            "data": postback_data,
            "result": result
        }

    except Exception as e:
        logger.error(f"Error simulating postback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/webhook-url")
async def get_webhook_url(current_user: User = Depends(get_current_user)):
    """
    Получение URL для вебхука Pocket Option
    """
    return {
        "webhook_url": "https://visionoftrading.com/api/pocket-option/postback",
        "user_id": current_user.id,
        "instructions": "Use this URL in your Pocket Option postback settings"
    }

from ..db import get_db
from ..models.user import User
from .auth import get_current_user
from typing import Optional
import requests
import logging

router = APIRouter(prefix="/pocket-option", tags=["pocket-option"])
logger = logging.getLogger(__name__)

@router.post("/postback")
async def pocket_option_postback(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Обработка постбека от Pocket Option (POST)
    """
    try:
        # Пытаемся получить JSON данные
        try:
            data = await request.json()
            logger.info(f"Received Pocket Option POST postback (JSON): {data}")
        except:
            # Если не JSON, получаем form data
            form_data = await request.form()
            data = dict(form_data)
            logger.info(f"Received Pocket Option POST postback (FORM): {data}")

        # Извлекаем данные из постбека
        # Проверяем формат Pocket Option (GET параметры в POST)
        if "click_id" in data or "reg" in data or "conf" in data or "ftd" in data or "dep" in data:
            # Pocket Option формат
            click_id = data.get("click_id")
            reg = data.get("reg")
            conf = data.get("conf")
            ftd = data.get("ftd")
            dep = data.get("dep")
            a = data.get("a")
            ac = data.get("ac")

            # Определяем действие (поддерживаем и "1"/"0" и "true"/"false")
            action = None
            if reg in ["1", "true"]:
                action = "registration"
            elif conf in ["1", "true"]:
                action = "email_confirmed"
            elif ftd in ["1", "true"]:
                action = "first_deposit"
            elif dep in ["1", "true"]:
                action = "deposit"

            if not action:
                logger.warning(f"No valid action found in POST postback: {data}")
                return {"status": "ignored", "message": "No valid action"}

            # Ищем пользователя по click_id или trader_id
            user = None
            trader_id = data.get("trader_id")

            if click_id:
                user = db.query(User).filter(User.pocket_option_id == click_id).first()
                logger.info(f"Searching by click_id: {click_id}")
            elif trader_id:
                user = db.query(User).filter(User.pocket_option_id == trader_id).first()
                logger.info(f"Searching by trader_id: {trader_id}")

            if not user:
                logger.warning(f"User not found for click_id: {click_id}, trader_id: {trader_id}")
                return {"status": "ignored", "message": f"User not found for click_id: {click_id}, trader_id: {trader_id}"}

            # Обновляем данные пользователя
            if action == "registration":
                user.pocket_option_verified = True
                logger.info(f"User {user.id} registered with Pocket Option")

            elif action == "email_confirmed":
                user.is_verified = True
                logger.info(f"User {user.id} email confirmed")

            elif action in ["first_deposit", "deposit"]:
                user.has_min_deposit = True
                logger.info(f"User {user.id} made {action}")

            db.commit()
            return {"status": "success", "message": f"{action} processed successfully"}

        else:
            # Стандартный JSON формат
            user_id = data.get("user_id")
            pocket_option_id = data.get("pocket_option_id")
            action = data.get("action")  # registration, deposit, trade, etc.
            amount = data.get("amount", 0)
            balance = data.get("balance", 0)

        if not user_id or not pocket_option_id:
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: user_id, pocket_option_id"
            )

        # Находим пользователя
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # Обновляем данные пользователя
        if action == "registration":
            user.pocket_option_id = pocket_option_id
            user.pocket_option_verified = True
            logger.info(f"User {user_id} registered with Pocket Option ID: {pocket_option_id}")

        elif action == "deposit":
            user.pocket_option_balance = balance
            # Проверяем минимальный депозит (>= 10 USD)
            if balance >= 10.0:
                user.has_min_deposit = True
            logger.info(f"User {user_id} deposited {amount}, new balance: {balance}")

        elif action == "trade":
            user.pocket_option_balance = balance
            logger.info(f"User {user_id} traded, new balance: {balance}")

        db.commit()

        return {"status": "success", "message": "Postback processed successfully"}

    except Exception as e:
        logger.error(f"Error processing postback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/postback")
async def pocket_option_get_postback(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Обработка GET постбека от Pocket Option (стандартный формат)
    """
    try:
        # Получаем все query параметры
        params = dict(request.query_params)
        logger.info(f"Received Pocket Option GET postback: {params}")

        # Извлекаем данные из параметров
        click_id = params.get("click_id")
        reg = params.get("reg")
        conf = params.get("conf")
        ftd = params.get("ftd")
        dep = params.get("dep")
        a = params.get("a")
        ac = params.get("ac")

        # Определяем действие на основе параметров (поддерживаем и "1"/"0" и "true"/"false")
        action = None
        if reg in ["1", "true"]:
            action = "registration"
        elif conf in ["1", "true"]:
            action = "email_confirmed"
        elif ftd in ["1", "true"]:
            action = "first_deposit"
        elif dep in ["1", "true"]:
            action = "deposit"

        if not action:
            logger.warning(f"No valid action found in postback: {params}")
            return {"status": "ignored", "message": "No valid action"}

        # Ищем пользователя по click_id (если есть)
        user = None
        if click_id:
            # Здесь можно добавить логику поиска пользователя по click_id
            # Пока что используем click_id как pocket_option_id
            user = db.query(User).filter(User.pocket_option_id == click_id).first()

        if not user:
            logger.warning(f"User not found for click_id: {click_id}")
            return {"status": "ignored", "message": "User not found"}

        # Обновляем данные пользователя
        if action == "registration":
            user.pocket_option_verified = True
            logger.info(f"User {user.id} registered with Pocket Option")

        elif action == "email_confirmed":
            user.is_verified = True
            logger.info(f"User {user.id} email confirmed")

        elif action in ["first_deposit", "deposit"]:
            # Для депозитов нужно получить баланс из другого API или параметра
            # Пока что устанавливаем has_min_deposit = True
            user.has_min_deposit = True
            logger.info(f"User {user.id} made {action}")

        db.commit()

        return {"status": "success", "message": f"{action} processed successfully"}

    except Exception as e:
        logger.error(f"Error processing GET postback: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/verify-pocket-option")
async def verify_pocket_option(
    pocket_option_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Верификация Pocket Option ID пользователя

    Проверяет что:
    1. С таким ID был постбэк от Pocket Option
    2. Этот ID не используется другим пользователем
    """
    try:
        if not pocket_option_id:
            raise HTTPException(
                status_code=400,
                detail="Pocket Option ID is required"
            )
        # Проверяем, был ли постбэк с таким pocket_option_id
        # Ищем любого пользователя с этим ID, у которого был постбэк
        user_with_postback = db.query(User).filter(
            User.pocket_option_id == pocket_option_id
        ).first()

        if not user_with_postback:
            logger.warning(f"No postback received for Pocket Option ID: {pocket_option_id}")
            raise HTTPException(
                status_code=400,
                detail="No postback received from Pocket Option for this ID. Please register with Pocket Option first."
            )

        # Проверяем, что этот ID принадлежит текущему пользователю или что у него еще нет ID
        if user_with_postback.id != current_user.id:
            logger.warning(f"Pocket Option ID {pocket_option_id} already belongs to user {user_with_postback.id}")
            raise HTTPException(
                status_code=400,
                detail="This Pocket Option ID is already registered by another user"
            )

        # Если все проверки пройдены, подтверждаем верификацию
        current_user.pocket_option_verified = True

        db.commit()

        logger.info(f"User {current_user.id} verified with Pocket Option ID: {pocket_option_id}")

        return {
            "status": "success",
            "message": "Pocket Option ID verified successfully",
            "pocket_option_id": pocket_option_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying Pocket Option ID: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-balance/{pocket_option_id}")
async def check_balance(
    pocket_option_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Проверка баланса пользователя в Pocket Option
    """
    try:
        # Здесь должна быть логика обращения к табличке на Pocket Option
        # Пока что возвращаем моковые данные

        # Пример обращения к внешней табличке
        # response = requests.get(f"https://pocketoptions.com/api/balance/{pocket_option_id}")
        # balance_data = response.json()

        # Моковые данные для демонстрации
        balance_data = {
            "balance": 250.75,
            "currency": "USD",
            "last_updated": "2024-01-15T10:30:00Z",
            "status": "active"
        }

        # Обновляем баланс в базе данных
        current_user.pocket_option_balance = balance_data["balance"]
        db.commit()

        return {
            "status": "success",
            "balance": balance_data["balance"],
            "currency": balance_data["currency"],
            "pocket_option_id": pocket_option_id
        }

    except Exception as e:
        logger.error(f"Error checking balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulate-postback")
async def simulate_postback(
    user_id: int,
    action: str,
    amount: Optional[float] = None,
    balance: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Симуляция постбека для тестирования
    """
    try:
        postback_data = {
            "user_id": user_id,
            "pocket_option_id": f"PO{user_id:06d}",
            "action": action,
            "amount": amount or 0,
            "balance": balance or 100.0
        }

        # Вызываем обработчик постбека
        result = await pocket_option_postback(postback_data, db)

        return {
            "status": "success",
            "message": "Postback simulated successfully",
            "data": postback_data,
            "result": result
        }

    except Exception as e:
        logger.error(f"Error simulating postback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/webhook-url")
async def get_webhook_url(current_user: User = Depends(get_current_user)):
    """
    Получение URL для вебхука Pocket Option
    """
    return {
        "webhook_url": "https://visionoftrading.com/api/pocket-option/postback",
        "user_id": current_user.id,
        "instructions": "Use this URL in your Pocket Option postback settings"
    }
