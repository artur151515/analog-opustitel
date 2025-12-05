import hmac
import hashlib
import time
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from .config import settings


def verify_tv_signature(payload: str, signature: str) -> bool:
    if not signature:
        return False
    
    expected_signature = hmac.new(
        settings.tv_webhook_secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)


def validate_timestamp(timestamp_ms: int, tolerance_minutes: int = 10) -> bool:
    current_time_ms = int(time.time() * 1000)
    tolerance_ms = tolerance_minutes * 60 * 1000
    
    return abs(current_time_ms - timestamp_ms) <= tolerance_ms


def validate_symbol(symbol: str) -> bool:
    return symbol.upper() in [s.upper() for s in settings.allowed_symbols]


def calculate_signal_times(timestamp_ms: int, timeframe: str) -> tuple[datetime, datetime]:
    from datetime import datetime, timedelta
    
    signal_time = datetime.fromtimestamp(timestamp_ms / 1000)
    
    enter_at = signal_time + timedelta(seconds=60)
    
    timeframe_durations = {
        '1m': 60,
        '3m': 180,
        '5m': 300,
        '7m': 420,
        '15m': 900,
        '30m': 1800,
        '1h': 3600,
        '4h': 14400,
        '1d': 86400
    }
    
    duration_seconds = timeframe_durations.get(timeframe, 300)
    
    expire_at = enter_at + timedelta(seconds=duration_seconds)
    
    return enter_at, expire_at


def create_idempotency_key(symbol: str, timeframe: str, timestamp_ms: int) -> str:
    return f"signal:{symbol}:{timeframe}:{timestamp_ms}"
