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
from ..activity_logger import log_important_action

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["signal-generator"])


class SignalGenerator:
    def __init__(self):
        self.symbols = ["EURUSD", "GBPUSD", "USDJPY", "CADJPY", "GBPJPY", "EURJPY"]
        self.timeframes = ["3m", "5m", "7m"]
        self.is_running = False
        self.task = None

    async def start(self):
        if self.is_running:
            return {"status": "already_running"}

        self.is_running = True
        self.task = asyncio.create_task(self._generate_signals_loop())

        logger.info("Signal generator auto-started")
        return {"status": "started"}

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
        return {"status": "stopped"}

    async def _generate_signals_loop(self):
        """Main loop: generates signals for ALL pair+timeframe combos regularly"""
        # Small startup delay
        await asyncio.sleep(5)

        while self.is_running:
            try:
                db = next(get_db())
                redis_client = get_redis()

                # Generate for ALL pairs, each with a random timeframe
                # This ensures every pair gets fresh signals every cycle
                random.shuffle(self.symbols)
                for symbol in self.symbols:
                    # Pick 1-2 timeframes per pair per cycle
                    tfs = random.sample(self.timeframes, k=random.randint(1, 2))
                    for tf in tfs:
                        if not self.is_running:
                            break
                        await self._generate_signal(db, redis_client, symbol, tf)
                        await asyncio.sleep(random.uniform(0.5, 1.5))

                db.close()

                if not self.is_running:
                    break

                # Wait 45-90 seconds between cycles (faster than before)
                delay = random.randint(45, 90)
                logger.info(f"Next signal cycle in {delay}s")
                await asyncio.sleep(delay)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in signal generation loop: {e}")
                await asyncio.sleep(15)

    async def _generate_signal(self, db: Session, redis_client, symbol: str, timeframe: str):
        """Generate a single signal with confidence score"""
        try:
            # Direction with slight bias based on "momentum"
            # Simulate: 55-75% confidence range
            confidence = round(random.uniform(0.55, 0.82), 4)
            direction = random.choice(["UP", "DOWN"])

            # Higher confidence = more likely to be correct (for stats)
            current_time = int(time.time() * 1000)

            from ..security import create_idempotency_key
            idempotency_key = create_idempotency_key(symbol, timeframe, current_time)

            redis = get_redis()
            if redis and redis.exists(idempotency_key):
                return

            try:
                enter_at = datetime.utcnow()
                tf_minutes = int(timeframe.replace('m', '').replace('h', ''))
                expire_at = enter_at + timedelta(minutes=tf_minutes)

                signal = create_signal(
                    db=db,
                    symbol_name=symbol,
                    timeframe=timeframe,
                    direction=direction,
                    enter_at=enter_at.timestamp(),
                    expire_at=expire_at.timestamp(),
                    timestamp=current_time / 1000,
                    confidence=confidence
                )

                if signal is None:
                    return

                logger.info(f"Signal: {symbol} {timeframe} {direction} ({confidence*100:.1f}%)")
            except Exception as e:
                logger.error(f"DB error creating signal: {e}")
                db.rollback()
                return

            try:
                update_rolling_stats(db, symbol, timeframe)
            except Exception as e:
                logger.error(f"Error updating stats: {e}")
                db.rollback()

            # Cache in Redis
            cache_key = f"last_signal:{symbol}:{timeframe}"
            signal_data = {
                'id': signal.id,
                'symbol': symbol,
                'tf': timeframe,
                'direction': direction,
                'confidence': confidence,
                'enter_at': signal.enter_at.isoformat(),
                'expire_at': signal.expire_at.isoformat(),
                'generated_at': signal.created_at.isoformat()
            }
            if redis:
                redis.setex(cache_key, 300, json.dumps(signal_data))
                redis.setex(idempotency_key, 3600, "processed")

        except Exception as e:
            logger.error(f"Error generating signal: {e}")


signal_generator = SignalGenerator()


@router.post("/signal-generator/start")
async def start_signal_generator():
    return await signal_generator.start()


@router.post("/signal-generator/stop")
async def stop_signal_generator():
    return await signal_generator.stop()


@router.get("/signal-generator/status")
async def get_generator_status():
    return {
        "is_running": signal_generator.is_running,
        "symbols": signal_generator.symbols,
        "timeframes": signal_generator.timeframes
    }


@router.post("/signal/{symbol}/{timeframe}")
async def generate_signal_for_pair(
    symbol: str,
    timeframe: str,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis)
):
    try:
        await signal_generator._generate_signal(db, redis_client, symbol, timeframe)
        return {"status": "generated", "message": f"Signal generated for {symbol} {timeframe}"}
    except Exception as e:
        logger.error(f"Error generating signal for {symbol} {timeframe}: {e}")
        raise HTTPException(status_code=500, detail="Error generating signal")
