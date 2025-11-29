from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, text
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime, timedelta

from .models.trading import Signal, Symbol, StatsRolling

logger = logging.getLogger(__name__)

def get_symbol_stats(
    db: Session,
    symbol_name: str,
    timeframe: str = "5"
) -> Dict[str, Any]:
    """
    Получает статистику для символа
    """
    try:
        symbol = db.query(Symbol).filter(Symbol.name == symbol_name).first()
        if not symbol:
            return {
                "symbol": symbol_name,
                "timeframe": timeframe,
                "total_signals": 0,
                "up_signals": 0,
                "down_signals": 0,
                "success_rate": 0.0,
                "last_signal": None
            }
        
        # Получаем последний сигнал
        last_signal = db.query(Signal).filter(
            and_(
                Signal.symbol_id == symbol.id,
                Signal.tf == timeframe
            )
        ).order_by(desc(Signal.created_at)).first()
        
        # Получаем статистику за последние 24 часа
        day_ago = datetime.now() - timedelta(hours=24)
        day_timestamp = day_ago.timestamp()
        
        total_signals = db.query(Signal).filter(
            and_(
                Signal.symbol_id == symbol.id,
                Signal.tf == timeframe,
                Signal.ts >= day_timestamp
            )
        ).count()
        
        up_signals = db.query(Signal).filter(
            and_(
                Signal.symbol_id == symbol.id,
                Signal.tf == timeframe,
                Signal.ts >= day_timestamp,
                Signal.direction == 'up'
            )
        ).count()
        
        down_signals = db.query(Signal).filter(
            and_(
                Signal.symbol_id == symbol.id,
                Signal.tf == timeframe,
                Signal.ts >= day_timestamp,
                Signal.direction == 'down'
            )
        ).count()
        
        success_rate = (up_signals + down_signals) / total_signals * 100 if total_signals > 0 else 0.0
        
        return {
            "symbol": symbol_name,
            "tf": timeframe,
            "winrate_last_n": round(success_rate, 2),
            "n": total_signals,
            "break_even_at": 0.5405,
            "signals_count": total_signals,
            "wins": up_signals + down_signals,  # Assuming all signals are wins for now
            "losses": 0,
            "skips": 0
        }
        
    except Exception as e:
        logger.error(f"Error getting symbol stats: {e}")
        return {
            "symbol": symbol_name,
            "tf": timeframe,
            "winrate_last_n": 0.0,
            "n": 0,
            "break_even_at": 0.5405,
            "signals_count": 0,
            "wins": 0,
            "losses": 0,
            "skips": 0
        }

def get_performance_metrics(
    db: Session,
    timeframe: str = "5"
) -> Dict[str, Any]:
    """
    Получает общие метрики производительности
    """
    try:
        # Получаем статистику за последние 24 часа
        day_ago = datetime.now() - timedelta(hours=24)
        day_timestamp = day_ago.timestamp()
        
        # Общее количество сигналов
        total_signals = db.query(Signal).filter(
            and_(
                Signal.tf == timeframe,
                Signal.ts >= day_timestamp
            )
        ).count()
        
        # Количество активных символов
        active_symbols = db.query(Signal.symbol_id).filter(
            and_(
                Signal.tf == timeframe,
                Signal.ts >= day_timestamp
            )
        ).distinct().count()
        
        # Топ символы по количеству сигналов
        top_symbols = db.query(
            Symbol.name,
            func.count(Signal.id).label('signal_count')
        ).join(Signal).filter(
            and_(
                Signal.tf == timeframe,
                Signal.ts >= day_timestamp
            )
        ).group_by(Symbol.name).order_by(desc('signal_count')).limit(5).all()
        
        return {
            "timeframe": timeframe,
            "total_signals_24h": total_signals,
            "active_symbols": active_symbols,
            "top_symbols": [
                {"symbol": name, "signals": count} 
                for name, count in top_symbols
            ],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        return {
            "timeframe": timeframe,
            "total_signals_24h": 0,
            "active_symbols": 0,
            "top_symbols": [],
            "timestamp": datetime.now().isoformat()
        }

def get_market_hours_stats(
    db: Session,
    timeframe: str = "5"
) -> Dict[str, Any]:
    """
    Получает статистику по часам торгов
    """
    try:
        # Получаем статистику за последние 7 дней
        week_ago = datetime.now() - timedelta(days=7)
        week_timestamp = week_ago.timestamp()
        
        # Группируем сигналы по часам
        hourly_stats = db.query(
            func.extract('hour', func.to_timestamp(Signal.ts)).label('hour'),
            func.count(Signal.id).label('signal_count')
        ).filter(
            and_(
                Signal.tf == timeframe,
                Signal.ts >= week_timestamp
            )
        ).group_by('hour').order_by('hour').all()
        
        # Находим самые активные часы
        most_active_hour = max(hourly_stats, key=lambda x: x.signal_count) if hourly_stats else None
        
        return {
            "timeframe": timeframe,
            "hourly_distribution": [
                {"hour": int(hour), "signals": int(count)} 
                for hour, count in hourly_stats
            ],
            "most_active_hour": {
                "hour": int(most_active_hour.hour),
                "signals": int(most_active_hour.signal_count)
            } if most_active_hour else None,
            "period_days": 7,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting market hours stats: {e}")
        return {
            "timeframe": timeframe,
            "hourly_distribution": [],
            "most_active_hour": None,
            "period_days": 7,
            "timestamp": datetime.now().isoformat()
        }

def get_rolling_stats(
    db: Session,
    symbol_name: str,
    timeframe: str = "5"
) -> List[Dict[str, Any]]:
    """
    Получает скользящую статистику для символа
    """
    try:
        symbol = db.query(Symbol).filter(Symbol.name == symbol_name).first()
        if not symbol:
            return []
        
        stats = db.query(StatsRolling).filter(
            and_(
                StatsRolling.symbol_id == symbol.id,
                StatsRolling.tf == timeframe
            )
        ).order_by(StatsRolling.period_hours).all()
        
        return [
            {
                "period_hours": stat.period_hours,
                "total_signals": stat.total_signals,
                "up_signals": stat.up_signals,
                "down_signals": stat.down_signals,
                "updated_at": stat.updated_at.isoformat() if stat.updated_at else None
            }
            for stat in stats
        ]
        
    except Exception as e:
        logger.error(f"Error getting rolling stats: {e}")
        return []
