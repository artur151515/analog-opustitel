from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta

from .models.trading import Signal, Symbol, StatsRolling
from .db import get_redis

logger = logging.getLogger(__name__)

def create_signal(
    db: Session,
    symbol_name: str,
    timeframe: str,
    direction: str,
    enter_at: float,
    expire_at: float,
    timestamp: Optional[float] = None
) -> Signal:
    """
    Создает новый сигнал в базе данных
    """
    try:
        # Находим или создаем символ
        symbol = db.query(Symbol).filter(Symbol.name == symbol_name).first()
        if not symbol:
            symbol = Symbol(name=symbol_name)
            db.add(symbol)
            db.flush()  # Получаем ID символа
        
        # Создаем сигнал
        signal = Signal(
            symbol_id=symbol.id,
            tf=timeframe,
            ts=datetime.fromtimestamp(timestamp) if timestamp else datetime.now(),
            direction=direction,
            enter_at=datetime.fromtimestamp(enter_at),
            expire_at=datetime.fromtimestamp(expire_at)
        )
        
        db.add(signal)
        db.commit()
        db.refresh(signal)
        
        logger.info(f"Created signal: {symbol_name} {timeframe} {direction} at {enter_at}")
        
        # Обновляем статистику
        update_rolling_stats(db, symbol_name, timeframe)
        
        return signal
        
    except Exception as e:
        logger.error(f"Error creating signal: {e}")
        db.rollback()
        raise

def update_rolling_stats(
    db: Session,
    symbol_name: str,
    timeframe: str
) -> None:
    """
    Обновляет скользящую статистику для символа и таймфрейма
    """
    try:
        # Получаем символ
        symbol = db.query(Symbol).filter(Symbol.name == symbol_name).first()
        if not symbol:
            return
        
        # Периоды для статистики (в часах)
        periods = [24, 168, 720]  # 1 день, 1 неделя, 1 месяц
        
        for period_hours in periods:
            # Время начала периода
            period_start = datetime.now() - timedelta(hours=period_hours)
            period_timestamp = period_start.timestamp()
            
            # Получаем сигналы за период
            signals = db.query(Signal).filter(
                and_(
                    Signal.symbol_id == symbol.id,
                    Signal.tf == timeframe,
                    Signal.ts >= period_start
                )
            ).all()
            
            if not signals:
                continue
            
            # Подсчитываем статистику
            total_signals = len(signals)
            up_signals = len([s for s in signals if s.direction == 'up'])
            down_signals = len([s for s in signals if s.direction == 'down'])
            
            # Находим или создаем запись статистики
            stats = db.query(StatsRolling).filter(
                and_(
                    StatsRolling.symbol_id == symbol.id,
                    StatsRolling.tf == timeframe,
                    StatsRolling.period_hours == period_hours
                )
            ).first()
            
            if not stats:
                stats = StatsRolling(
                    symbol_id=symbol.id,
                    tf=timeframe,
                    period_hours=period_hours
                )
                db.add(stats)
            
            # Обновляем статистику
            stats.total_signals = total_signals
            stats.up_signals = up_signals
            stats.down_signals = down_signals
            stats.updated_at = datetime.now()
            
            db.commit()
            
            logger.info(f"Updated stats for {symbol_name} {timeframe} {period_hours}h: {total_signals} total, {up_signals} up, {down_signals} down")
            
    except Exception as e:
        logger.error(f"Error updating rolling stats: {e}")
        db.rollback()
        raise

def get_latest_signal(
    db: Session,
    symbol_name: str,
    timeframe: str
) -> Optional[Signal]:
    """
    Получает последний сигнал для символа и таймфрейма
    """
    try:
        symbol = db.query(Symbol).filter(Symbol.name == symbol_name).first()
        if not symbol:
            return None
        
        signal = db.query(Signal).filter(
            and_(
                Signal.symbol_id == symbol.id,
                Signal.tf == timeframe
            )
        ).order_by(desc(Signal.created_at)).first()
        
        return signal
        
    except Exception as e:
        logger.error(f"Error getting latest signal: {e}")
        return None

def get_signals_count(
    db: Session,
    symbol_name: str,
    timeframe: str,
    hours: int = 24
) -> Dict[str, int]:
    """
    Получает количество сигналов за указанный период
    """
    try:
        symbol = db.query(Symbol).filter(Symbol.name == symbol_name).first()
        if not symbol:
            return {"total": 0, "up": 0, "down": 0}
        
        # Время начала периода
        period_start = datetime.now() - timedelta(hours=hours)
        
        # Подсчитываем сигналы
        total = db.query(Signal).filter(
            and_(
                Signal.symbol_id == symbol.id,
                Signal.tf == timeframe,
                Signal.ts >= period_start
            )
        ).count()
        
        up = db.query(Signal).filter(
            and_(
                Signal.symbol_id == symbol.id,
                Signal.tf == timeframe,
                Signal.ts >= period_start,
                Signal.direction == 'up'
            )
        ).count()
        
        down = db.query(Signal).filter(
            and_(
                Signal.symbol_id == symbol.id,
                Signal.tf == timeframe,
                Signal.ts >= period_start,
                Signal.direction == 'down'
            )
        ).count()
        
        return {"total": total, "up": up, "down": down}
        
    except Exception as e:
        logger.error(f"Error getting signals count: {e}")
        return {"total": 0, "up": 0, "down": 0}

