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
    timestamp: Optional[float] = None,
    confidence: Optional[float] = None
) -> Signal:
    try:
        symbol = db.query(Symbol).filter(Symbol.name == symbol_name).first()
        if not symbol:
            symbol = Symbol(name=symbol_name)
            db.add(symbol)
            db.flush()

        signal = Signal(
            symbol_id=symbol.id,
            tf=timeframe,
            ts=datetime.fromtimestamp(timestamp) if timestamp else datetime.now(),
            direction=direction,
            confidence=confidence,
            enter_at=datetime.fromtimestamp(enter_at),
            expire_at=datetime.fromtimestamp(expire_at)
        )

        db.add(signal)
        db.commit()
        db.refresh(signal)

        logger.info(f"Created signal: {symbol_name} {timeframe} {direction} conf={confidence} at {enter_at}")

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
    try:
        symbol = db.query(Symbol).filter(Symbol.name == symbol_name).first()
        if not symbol:
            return

        # Use window=200 as default (matches model)
        window = 200

        # Count recent signals
        signals = db.query(Signal).filter(
            and_(
                Signal.symbol_id == symbol.id,
                Signal.tf == timeframe
            )
        ).order_by(desc(Signal.ts)).limit(window).all()

        if not signals:
            return

        total = len(signals)
        ups = len([s for s in signals if s.direction == 'UP'])
        downs = len([s for s in signals if s.direction == 'DOWN'])

        # Simple winrate based on direction balance
        winrate = ups / total if total > 0 else 0.5

        stats = db.query(StatsRolling).filter(
            and_(
                StatsRolling.symbol_id == symbol.id,
                StatsRolling.tf == timeframe,
                StatsRolling.window == window
            )
        ).first()

        if not stats:
            stats = StatsRolling(
                symbol_id=symbol.id,
                tf=timeframe,
                window=window
            )
            db.add(stats)

        stats.total_signals = total
        stats.wins = ups
        stats.losses = downs
        stats.winrate = winrate

        db.commit()

        logger.info(f"Updated stats for {symbol_name} {timeframe}: {total} total, winrate={winrate:.2f}")

    except Exception as e:
        logger.error(f"Error updating rolling stats: {e}")
        db.rollback()

def get_latest_signal(
    db: Session,
    symbol_name: str,
    timeframe: str
) -> Optional[Signal]:
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
    try:
        symbol = db.query(Symbol).filter(Symbol.name == symbol_name).first()
        if not symbol:
            return {"total": 0, "up": 0, "down": 0}

        period_start = datetime.now() - timedelta(hours=hours)

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
                Signal.direction == 'UP'
            )
        ).count()

        down = db.query(Signal).filter(
            and_(
                Signal.symbol_id == symbol.id,
                Signal.tf == timeframe,
                Signal.ts >= period_start,
                Signal.direction == 'DOWN'
            )
        ).count()

        return {"total": total, "up": up, "down": down}

    except Exception as e:
        logger.error(f"Error getting signals count: {e}")
        return {"total": 0, "up": 0, "down": 0}
