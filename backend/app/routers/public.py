from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Dict, Any
import json
import logging
from datetime import datetime

from ..db import get_db, get_redis
from ..schema import SignalResponse, StatsResponse, HealthResponse, ErrorResponse
from ..signals import get_latest_signal
from ..stats import get_symbol_stats, get_performance_metrics, get_market_hours_stats
from ..config import settings
from ..activity_logger import log_important_action

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["public"])


@router.get("/signal", response_model=Optional[SignalResponse])
async def get_signal(
    symbol: str = Query(..., description="Trading symbol (e.g., CADJPY)"),
    tf: str = Query(..., description="Timeframe (e.g., 5m)"),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis)
):
    try:
        cache_key = f"last_signal:{symbol.upper()}:{tf}"
        cached_signal = redis_client.get(cache_key)
        
        if cached_signal:
            signal_data = json.loads(cached_signal)
            signal_data['confidence'] = signal_data.get('confidence', 0.5)
            return SignalResponse(**signal_data)
        
        signal = get_latest_signal(db, symbol, tf)
        
        if not signal:
            return None
        
        signal_data = {
            'id': signal.id,
            'symbol': signal.symbol.name,
            'tf': signal.tf,
            'direction': signal.direction,
            'enter_at': signal.enter_at.isoformat(),
            'expire_at': signal.expire_at.isoformat(),
            'generated_at': signal.created_at.isoformat()
        }
        
        redis_client.setex(
            cache_key,
            settings.redis_cache_ttl,
            json.dumps(signal_data)
        )
        
        response = SignalResponse(
            id=signal.id,  # type: ignore
            symbol=signal.symbol.name,  # type: ignore
            tf=signal.tf,  # type: ignore
            direction=signal.direction,  # type: ignore
            enter_at=signal.enter_at,  # type: ignore
            expire_at=signal.expire_at,  # type: ignore
            generated_at=signal.created_at,  # type: ignore
            confidence=0.5
        )
        
        try:
            await log_important_action(
                db, 
                None, 
                "SIGNAL_VIEWED", 
                f"Просмотрен сигнал: {signal.symbol.name} {signal.tf} {signal.direction}"
            )
        except Exception as e:
            logger.error(f"Error logging signal view: {e}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting signal: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get signal"
        )


@router.get("/stats", response_model=Optional[StatsResponse])
async def get_stats(
    symbol: str = Query(..., description="Trading symbol (e.g., CADJPY)"),
    tf: str = Query(..., description="Timeframe (e.g., 5m)"),
    db: Session = Depends(get_db)
):
    try:
        stats = get_symbol_stats(db, symbol, tf)
        return stats
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics"
        )


@router.get("/stats/performance")
async def get_performance_stats(
    symbol: str = Query(..., description="Trading symbol (e.g., CADJPY)"),
    tf: str = Query(..., description="Timeframe (e.g., 5m)"),
    days: int = Query(30, description="Number of days to analyze", ge=1, le=365),
    db: Session = Depends(get_db)
):
    try:
        metrics = get_performance_metrics(db, tf)
        return metrics
        
    except Exception as e:
        logger.error(f"Error getting performance stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get performance metrics"
        )


@router.get("/stats/market-hours")
async def get_market_hours_stats_endpoint(
    symbol: str = Query(..., description="Trading symbol (e.g., CADJPY)"),
    tf: str = Query(..., description="Timeframe (e.g., 5m)"),
    db: Session = Depends(get_db)
):
    try:
        hourly_stats = get_market_hours_stats(db, tf)
        return hourly_stats
        
    except Exception as e:
        logger.error(f"Error getting market hours stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get market hours statistics"
        )


@router.get("/health", response_model=HealthResponse)
async def health_check(
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis)
):
    try:
        db_status = "connected"
        try:
            db.execute(text("SELECT 1"))
        except Exception:
            db_status = "disconnected"
        
        redis_status = "connected"
        try:
            redis_client.ping()
        except Exception:
            redis_status = "disconnected"
        
        return HealthResponse(
            status="healthy" if db_status == "connected" and redis_status == "connected" else "unhealthy",
            timestamp=datetime.now(),
            version=settings.app_version,
            database=db_status,
            redis=redis_status
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.now(),
            version=settings.app_version,
            database="unknown",
            redis="unknown"
        )


@router.get("/symbols")
async def get_available_symbols():
    return {
        "symbols": settings.allowed_symbols,
        "timeframes": ["3m", "5m", "7m"]
    }


@router.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": "Vision of Trading Trading Signals API",
        "endpoints": {
            "webhook": "/api/tv-hook",
            "signal": "/api/signal",
            "stats": "/api/stats",
            "health": "/api/health"
        },
        "compliance": {
            "age_restriction": "18+",
            "disclaimer": "Not financial advice",
            "risk_warning": "Trading involves risk"
        }
    }
