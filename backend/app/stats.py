from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from .models import Signal, Symbol, StatsRolling, Verdict
from .schema import StatsResponse


def get_symbol_stats(db: Session, symbol_name: str, timeframe: str) -> Optional[StatsResponse]:
    """
    Get comprehensive statistics for a symbol and timeframe
    
    Args:
        db: Database session
        symbol_name: Trading symbol
        timeframe: Timeframe
        
    Returns:
        StatsResponse object with statistics
    """
    symbol = db.query(Symbol).filter(Symbol.name == symbol_name.upper()).first()
    if not symbol:
        return None
    
    # Get rolling stats
    rolling_stats = db.query(StatsRolling).filter(
        and_(
            StatsRolling.symbol_id == symbol.id,
            StatsRolling.tf == timeframe,
            StatsRolling.window == 200
        )
    ).first()
    
    if not rolling_stats:
        # Calculate stats if not exists
        from .signals import update_rolling_stats
        rolling_stats = update_rolling_stats(db, symbol_name, timeframe, 200)
    
    # Calculate total signals count
    total_signals = db.query(Signal).join(Symbol).filter(
        and_(
            Symbol.name == symbol_name.upper(),
            Signal.tf == timeframe
        )
    ).count()
    
    return StatsResponse(
        symbol=symbol_name.upper(),
        tf=timeframe,
        winrate_last_n=rolling_stats.winrate,
        n=rolling_stats.window,
        break_even_at=rolling_stats.break_even_rate,
        signals_count=total_signals,
        wins=rolling_stats.wins,
        losses=rolling_stats.losses,
        skips=rolling_stats.skips
    )


def get_all_symbols_stats(db: Session) -> Dict[str, Dict[str, Any]]:
    """
    Get statistics for all symbols and timeframes
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with statistics for all symbols
    """
    symbols = db.query(Symbol).all()
    stats_dict = {}
    
    for symbol in symbols:
        symbol_stats = {}
        
        # Get all timeframes for this symbol
        timeframes = db.query(Signal.tf).join(Symbol).filter(
            Symbol.name == symbol.name
        ).distinct().all()
        
        for (tf,) in timeframes:
            stats = get_symbol_stats(db, symbol.name, tf)
            if stats:
                symbol_stats[tf] = stats.dict()
        
        if symbol_stats:
            stats_dict[symbol.name] = symbol_stats
    
    return stats_dict


def get_recent_signals(db: Session, symbol_name: str, timeframe: str, limit: int = 10) -> list:
    """
    Get recent signals for a symbol and timeframe
    
    Args:
        db: Database session
        symbol_name: Trading symbol
        timeframe: Timeframe
        limit: Maximum number of signals to return
        
    Returns:
        List of recent signals
    """
    return db.query(Signal).join(Symbol).filter(
        and_(
            Symbol.name == symbol_name.upper(),
            Signal.tf == timeframe
        )
    ).order_by(desc(Signal.created_at)).limit(limit).all()


def get_performance_metrics(db: Session, symbol_name: str, timeframe: str, days: int = 30) -> Dict[str, Any]:
    """
    Get performance metrics for a symbol over a period
    
    Args:
        db: Database session
        symbol_name: Trading symbol
        timeframe: Timeframe
        days: Number of days to analyze
        
    Returns:
        Dictionary with performance metrics
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    symbol = db.query(Symbol).filter(Symbol.name == symbol_name.upper()).first()
    if not symbol:
        return {}
    
    # Get signals in date range
    signals = db.query(Signal).join(Symbol).filter(
        and_(
            Symbol.name == symbol_name.upper(),
            Signal.tf == timeframe,
            Signal.created_at >= start_date,
            Signal.created_at <= end_date
        )
    ).all()
    
    if not signals:
        return {
            'total_signals': 0,
            'wins': 0,
            'losses': 0,
            'skips': 0,
            'winrate': 0.0,
            'avg_hold_time': 0,
            'best_day': None,
            'worst_day': None
        }
    
    # Calculate metrics
    wins = 0
    losses = 0
    skips = 0
    total_hold_time = 0
    
    for signal in signals:
        verdicts = db.query(Verdict).filter(Verdict.signal_id == signal.id).all()
        if verdicts:
            latest_verdict = verdicts[-1]
            if latest_verdict.result == 'WIN':
                wins += 1
            elif latest_verdict.result == 'LOSS':
                losses += 1
            elif latest_verdict.result == 'SKIP':
                skips += 1
        
        # Calculate hold time
        hold_time = (signal.expire_at - signal.enter_at).total_seconds()
        total_hold_time += hold_time
    
    total_with_verdicts = wins + losses + skips
    winrate = (wins / total_with_verdicts) if total_with_verdicts > 0 else 0.0
    avg_hold_time = (total_hold_time / len(signals)) if signals else 0
    
    return {
        'total_signals': len(signals),
        'wins': wins,
        'losses': losses,
        'skips': skips,
        'winrate': winrate,
        'avg_hold_time': avg_hold_time,
        'period_days': days
    }


def get_market_hours_stats(db: Session, symbol_name: str, timeframe: str) -> Dict[str, Any]:
    """
    Get statistics broken down by market hours
    
    Args:
        db: Database session
        symbol_name: Trading symbol
        timeframe: Timeframe
        
    Returns:
        Dictionary with market hours statistics
    """
    symbol = db.query(Symbol).filter(Symbol.name == symbol_name.upper()).first()
    if not symbol:
        return {}
    
    # Get signals with hour information
    signals = db.query(
        Signal,
        func.extract('hour', Signal.created_at).label('hour')
    ).join(Symbol).filter(
        and_(
            Symbol.name == symbol_name.upper(),
            Signal.tf == timeframe
        )
    ).all()
    
    if not signals:
        return {}
    
    # Group by hour
    hourly_stats = {}
    for signal, hour in signals:
        hour = int(hour)
        if hour not in hourly_stats:
            hourly_stats[hour] = {'total': 0, 'wins': 0, 'losses': 0}
        
        hourly_stats[hour]['total'] += 1
        
        # Get verdicts for this signal
        verdicts = db.query(Verdict).filter(Verdict.signal_id == signal.id).all()
        if verdicts:
            latest_verdict = verdicts[-1]
            if latest_verdict.result == 'WIN':
                hourly_stats[hour]['wins'] += 1
            elif latest_verdict.result == 'LOSS':
                hourly_stats[hour]['losses'] += 1
    
    # Calculate winrates
    for hour in hourly_stats:
        stats = hourly_stats[hour]
        total_with_results = stats['wins'] + stats['losses']
        stats['winrate'] = (stats['wins'] / total_with_results) if total_with_results > 0 else 0.0
    
    return hourly_stats
