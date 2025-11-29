from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
import asyncio
import random
import time
import logging
import json
from datetime import datetime, timedelta

from ..db import get_db, get_redis
from ..schema import TVWebhookPayload
from ..signals import create_signal, update_rolling_stats

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["signal-generator"])

class SignalGenerator:
    def __init__(self):
        self.symbols = ["CADJPY", "EURUSD", "GBPUSD", "USDJPY"]
        self.timeframes = ["3m", "5m", "7m"]
        self.is_running = False
        self.task = None
    
    async def start(self):
        if self.is_running:
            return {"status": "already_running"}
        
        self.is_running = True
        self.task = asyncio.create_task(self._generate_signals_loop())
        
        logger.info("Signal generator started")
        return {"status": "started", "message": "Signal generator is now running"}
    
    async def stop(self):
        if not self.is_running:
            return {"status": "not_running"}
        
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        
        logger.info("Signal generator stopped")
        return {"status": "stopped", "message": "Signal generator stopped"}
    
    async def _generate_signals_loop(self):
        """Генерирует сигналы для всех таймфреймов каждые 30-60 секунд"""
        while self.is_running:
            try:
                # Получаем сессию базы данных
                db = next(get_db())
                redis_client = get_redis()
                
                # Генерируем сигналы для всех комбинаций символов и таймфреймов
                for symbol in self.symbols:
                    for timeframe in self.timeframes:
                        if not self.is_running:
                            break
                        await self._generate_random_signal(db, redis_client, symbol, timeframe)
                        await asyncio.sleep(2)  # Небольшая пауза между сигналами
                
                # Закрываем сессию базы данных
                db.close()
                
                if not self.is_running:
                    break
                
                # Случайная задержка перед следующим циклом (30-60 секунд)
                delay = random.randint(30, 60)
                await asyncio.sleep(delay)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in signal generation loop: {e}")
                await asyncio.sleep(10)  # Пауза при ошибке
    
    async def _generate_random_signal(self, db: Session, redis_client, symbol=None, timeframe=None):
        """Генерирует один случайный сигнал"""
        try:
            symbol = symbol or random.choice(self.symbols)
            timeframe = timeframe or random.choice(self.timeframes)
            direction = random.choice(["UP", "DOWN"])
            
            # Создаём payload как от TradingView с текущим временем
            current_time = int(time.time() * 1000)
            
            payload = TVWebhookPayload(
                ts=current_time,
                symbol=symbol,
                tf=timeframe,
                dir=direction
            )
            
            # Проверяем idempotency
            from ..security import create_idempotency_key
            idempotency_key = create_idempotency_key(symbol, timeframe, payload.ts)
            
            redis = get_redis()
            if redis.exists(idempotency_key):
                logger.info(f"Duplicate signal ignored: {idempotency_key}")
                return
            
            # Создаём сигнал
            try:
                # Вычисляем время входа и истечения
                enter_at = datetime.utcnow()
                expire_at = enter_at + timedelta(minutes=int(timeframe.replace('m', '')))
                
                signal = create_signal(
                    db=db,
                    symbol_name=symbol,
                    timeframe=timeframe,
                    direction=direction,
                    enter_at=enter_at.timestamp(),
                    expire_at=expire_at.timestamp(),
                    timestamp=payload.ts / 1000  # Конвертируем из миллисекунд
                )
                
                if signal is None:
                    logger.info(f"Signal already exists: {symbol} {timeframe} {payload.ts}")
                    return
                    
                logger.info(f"Created signal: {signal.id}")
            except Exception as e:
                logger.error(f"Database error creating signal: {e}")
                db.rollback()
                return
            
            # Обновляем статистику
            try:
                update_rolling_stats(db, symbol, timeframe)
            except Exception as e:
                logger.error(f"Error updating stats: {e}")
                db.rollback()
            
            # Кэшируем последний сигнал
            cache_key = f"last_signal:{symbol}:{timeframe}"
            signal_data = {
                'id': signal.id,
                'symbol': symbol,
                'tf': timeframe,
                'direction': direction,
                'enter_at': signal.enter_at.isoformat(),
                'expire_at': signal.expire_at.isoformat(),
                'generated_at': signal.created_at.isoformat()
            }
            redis.setex(
                cache_key,
                300,  # 5 минут TTL
                json.dumps(signal_data)
            )
            
            # Отмечаем как обработанный
            redis.setex(idempotency_key, 3600, "processed")
            
            logger.info(f"Generated signal: {symbol} {timeframe} {direction}")
            
        except Exception as e:
            logger.error(f"Error generating signal: {e}")

# Глобальный экземпляр генератора
signal_generator = SignalGenerator()

@router.post("/signal-generator/start")
async def start_signal_generator():
    """Запускает генератор сигналов"""
    return await signal_generator.start()

@router.post("/signal-generator/stop")
async def stop_signal_generator():
    """Останавливает генератор сигналов"""
    return await signal_generator.stop()

@router.get("/signal-generator/status")
async def get_generator_status():
    """Получает статус генератора сигналов"""
    return {
        "is_running": signal_generator.is_running,
        "symbols": signal_generator.symbols,
        "timeframes": signal_generator.timeframes
    }

@router.post("/signal-generator/generate-one")
async def generate_single_signal(
    symbol: str = None,
    timeframe: str = None,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis)
):
    """Генерирует один сигнал немедленно (для тестирования)"""
    await signal_generator._generate_random_signal(db, redis_client, symbol, timeframe)
    return {"status": "generated", "message": "One signal generated"}

@router.post("/signal/{symbol}/{timeframe}")
async def generate_signal_for_pair(
    symbol: str,
    timeframe: str,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis)
):
    """Генерирует новый сигнал для конкретной пары"""
    try:
        await signal_generator._generate_random_signal(db, redis_client, symbol, timeframe)
        return {"status": "generated", "message": f"New signal generated for {symbol} {timeframe}"}
    except Exception as e:
        logger.error(f"Error generating signal for {symbol} {timeframe}: {e}")
        raise HTTPException(status_code=500, detail="Error generating signal")
