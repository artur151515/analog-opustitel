import hmac
import hashlib
import time
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from .config import settings


def verify_tv_signature(payload: str, signature: str) -> bool:
    """
    Verify TradingView webhook signature using HMAC-SHA256
    
    Args:
        payload: Raw request body as string
        signature: X-TV-Signature header value
        
    Returns:
        bool: True if signature is valid, False otherwise
    """
    if not signature:
        return False
    
    # Create expected signature
    expected_signature = hmac.new(
        settings.tv_webhook_secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Compare signatures securely
    return hmac.compare_digest(signature, expected_signature)


def validate_timestamp(timestamp_ms: int, tolerance_minutes: int = 10) -> bool:
    """
    Validate that timestamp is within acceptable range
    
    Args:
        timestamp_ms: Unix timestamp in milliseconds
        tolerance_minutes: Acceptable time difference in minutes
        
    Returns:
        bool: True if timestamp is valid, False otherwise
    """
    current_time_ms = int(time.time() * 1000)
    tolerance_ms = tolerance_minutes * 60 * 1000
    
    return abs(current_time_ms - timestamp_ms) <= tolerance_ms


def validate_symbol(symbol: str) -> bool:
    """
    Validate that symbol is in allowed list
    
    Args:
        symbol: Trading symbol to validate
        
    Returns:
        bool: True if symbol is allowed, False otherwise
    """
    return symbol.upper() in [s.upper() for s in settings.allowed_symbols]


def calculate_signal_times(timestamp_ms: int, timeframe: str) -> tuple[datetime, datetime]:
    """
    Calculate enter_at and expire_at times for a signal
    
    Args:
        timestamp_ms: Signal timestamp in milliseconds
        timeframe: Timeframe string (e.g., "5m", "1h")
        
    Returns:
        tuple: (enter_at, expire_at) as datetime objects
    """
    from datetime import datetime, timedelta
    
    # Convert timestamp to datetime
    signal_time = datetime.fromtimestamp(timestamp_ms / 1000)
    
    # Calculate enter_at (signal time + 60 seconds)
    enter_at = signal_time + timedelta(seconds=60)
    
    # Calculate timeframe duration in seconds
    timeframe_durations = {
        '1m': 60,
        '3m': 180,
        '5m': 300,
        '15m': 900,
        '30m': 1800,
        '1h': 3600,
        '4h': 14400,
        '1d': 86400
    }
    
    duration_seconds = timeframe_durations.get(timeframe, 300)  # Default to 5m
    
    # Calculate expire_at
    expire_at = enter_at + timedelta(seconds=duration_seconds)
    
    return enter_at, expire_at


def create_idempotency_key(symbol: str, timeframe: str, timestamp_ms: int) -> str:
    """
    Create idempotency key for signal processing
    
    Args:
        symbol: Trading symbol
        timeframe: Timeframe
        timestamp_ms: Timestamp in milliseconds
        
    Returns:
        str: Idempotency key
    """
    return f"signal:{symbol}:{timeframe}:{timestamp_ms}"
