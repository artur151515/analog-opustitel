from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List
from enum import Enum


class DirectionEnum(str, Enum):
    UP = "UP"
    DOWN = "DOWN"


class ResultEnum(str, Enum):
    WIN = "WIN"
    LOSS = "LOSS"
    SKIP = "SKIP"


# TradingView Webhook Schemas
class TVWebhookPayload(BaseModel):
    ts: int = Field(..., description="Unix timestamp in milliseconds")
    symbol: str = Field(..., description="Trading symbol (e.g., CADJPY)")
    tf: str = Field(..., description="Timeframe (e.g., 5m)")
    dir: DirectionEnum = Field(..., description="Signal direction")
    
    @validator('symbol')
    def validate_symbol(cls, v):
        if not v or len(v) > 20:
            raise ValueError('Symbol must be non-empty and max 20 characters')
        return v.upper()
    
    @validator('tf')
    def validate_timeframe(cls, v):
        valid_timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']
        if v not in valid_timeframes:
            raise ValueError(f'Invalid timeframe. Must be one of: {valid_timeframes}')
        return v


class TVWebhookResponse(BaseModel):
    status: str = "success"
    message: str = "Signal processed successfully"
    signal_id: Optional[int] = None


# API Response Schemas
class SignalResponse(BaseModel):
    id: int
    symbol: str
    tf: str
    direction: DirectionEnum
    enter_at: datetime
    expire_at: datetime
    generated_at: datetime
    confidence: Optional[float] = Field(None, description="Signal confidence percentage")
    
    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    symbol: str
    tf: str
    winrate_last_n: float = Field(..., description="Winrate for last N signals")
    n: int = Field(..., description="Number of signals in calculation")
    break_even_at: float = Field(0.5405, description="Break-even winrate")
    signals_count: int = Field(..., description="Total signals count")
    wins: int = Field(0, description="Number of wins")
    losses: int = Field(0, description="Number of losses")
    skips: int = Field(0, description="Number of skips")
    
    class Config:
        from_attributes = True


class HealthResponse(BaseModel):
    status: str = "healthy"
    timestamp: datetime
    version: str
    database: str = "connected"
    redis: str = "connected"


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Internal schemas
class SignalCreate(BaseModel):
    symbol_id: int
    tf: str
    ts: datetime
    direction: DirectionEnum
    enter_at: datetime
    expire_at: datetime


class VerdictCreate(BaseModel):
    signal_id: int
    result: ResultEnum


class StatsUpdate(BaseModel):
    winrate: float
    total_signals: int
    wins: int
    losses: int
    skips: int
