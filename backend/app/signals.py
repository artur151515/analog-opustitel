from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func
from typing import Optional
from datetime import datetime
from .models import Signal, Symbol, Verdict, StatsRolling
from .schema import SignalCreate, DirectionEnum
from .security import calculate_signal_times, create_idempotency_key


def get_or_create_symbol(db: Session, symbol_name: str) -> Symbol:
    """Get existing symbol or create new one"""
    symbol = db.query(Symbol).filter(Symbol.name == symbol_name.upper()).first()
    if not symbol:
        symbol = Symbol(name=symbol_name.upper())
        db.add(symbol)
        db.commit()
        db.refresh(symbol)
    return symbol


def create_signal(db: Session, payload: dict) -> Optional[Signal]:
    """
    Create a new signal with idempotency check
    
    Args:
        db: Database session
        payload: TradingView webhook payload
        
    Returns:
        Signal object if created, None if duplicate
    """
    symbol_name = payload['symbol'].upper()
    timeframe = payload['tf']
    timestamp_ms = payload['ts']
    direction = payload['dir']
    
    # Check for duplicate using unique constraint
    existing_signal = db.query(Signal).join(Symbol).filter(
        and_(
            Symbol.name == symbol_name,
            Signal.tf == timeframe,
            Signal.ts == datetime.fromtimestamp(timestamp_ms / 1000)
        )
    ).first()
    
    if existing_signal:
        return None  # Duplicate signal
    
    # Get or create symbol
    symbol = get_or_create_symbol(db, symbol_name)
    
    # Calculate signal times
    enter_at, expire_at = calculate_signal_times(timestamp_ms, timeframe)
    
    # Create signal
    signal = Signal(
        symbol_id=symbol.id,
        tf=timeframe,
        ts=datetime.fromtimestamp(timestamp_ms / 1000),
        direction=direction,
        enter_at=enter_at,
        expire_at=expire_at
    )
    
    db.add(signal)
    db.commit()
    db.refresh(signal)
    
    return signal


def get_latest_signal(db: Session, symbol_name: str, timeframe: str) -> Optional[Signal]:
    """Get the latest signal for a symbol and timeframe"""
    return db.query(Signal).join(Symbol).filter(
        and_(
            Symbol.name == symbol_name.upper(),
            Signal.tf == timeframe
        )
    ).order_by(desc(Signal.created_at)).first()


def get_signal_by_id(db: Session, signal_id: int) -> Optional[Signal]:
    """Get signal by ID"""
    return db.query(Signal).filter(Signal.id == signal_id).first()


def get_signal_verdicts(db: Session, signal_id: int) -> list[Verdict]:
    """Get all verdicts for a signal"""
    return db.query(Verdict).filter(Verdict.signal_id == signal_id).all()


def update_signal_verdict(db: Session, signal_id: int, result: str) -> Verdict:
    """Add a verdict to a signal"""
    verdict = Verdict(signal_id=signal_id, result=result)
    db.add(verdict)
    db.commit()
    db.refresh(verdict)
    return verdict


def calculate_winrate(db: Session, symbol_name: str, timeframe: str, window: int = 200) -> dict:
    """
    Calculate winrate statistics for a symbol and timeframe
    
    Args:
        db: Database session
        symbol_name: Trading symbol
        timeframe: Timeframe
        window: Number of signals to include in calculation
        
    Returns:
        dict: Statistics including winrate, total signals, wins, losses, skips
    """
    # Get recent signals with verdicts
    recent_signals = db.query(Signal).join(Symbol).filter(
        and_(
            Symbol.name == symbol_name.upper(),
            Signal.tf == timeframe
        )
    ).order_by(desc(Signal.created_at)).limit(window).all()
    
    if not recent_signals:
        return {
            'winrate': 0.0,
            'total_signals': 0,
            'wins': 0,
            'losses': 0,
            'skips': 0
        }
    
    # Count verdicts
    wins = 0
    losses = 0
    skips = 0
    
    for signal in recent_signals:
        verdicts = get_signal_verdicts(db, signal.id)
        if verdicts:
            latest_verdict = verdicts[-1]  # Get most recent verdict
            if latest_verdict.result == 'WIN':
                wins += 1
            elif latest_verdict.result == 'LOSS':
                losses += 1
            elif latest_verdict.result == 'SKIP':
                skips += 1
    
    total_with_verdicts = wins + losses + skips
    winrate = (wins / total_with_verdicts) if total_with_verdicts > 0 else 0.0
    
    return {
        'winrate': winrate,
        'total_signals': len(recent_signals),
        'wins': wins,
        'losses': losses,
        'skips': skips,
        'signals_with_verdicts': total_with_verdicts
    }


def update_rolling_stats(db: Session, symbol_name: str, timeframe: str, window: int = 200) -> StatsRolling:
    """Update rolling statistics for a symbol and timeframe"""
    symbol = db.query(Symbol).filter(Symbol.name == symbol_name.upper()).first()
    if not symbol:
        return None
    
    # Get or create stats record
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
    
    # Calculate new statistics
    calc_stats = calculate_winrate(db, symbol_name, timeframe, window)
    
    # Update stats
    stats.winrate = calc_stats['winrate']
    stats.total_signals = calc_stats['total_signals']
    stats.wins = calc_stats['wins']
    stats.losses = calc_stats['losses']
    stats.skips = calc_stats['skips']
    
    db.commit()
    db.refresh(stats)
    
    return stats
