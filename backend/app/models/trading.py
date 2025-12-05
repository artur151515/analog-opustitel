from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base
import uuid
from datetime import datetime


class Symbol(Base):
    __tablename__ = "symbols"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    signals = relationship("Signal", back_populates="symbol")
    stats = relationship("StatsRolling", back_populates="symbol")


class Signal(Base):
    __tablename__ = "signals"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol_id = Column(Integer, ForeignKey("symbols.id"), nullable=False)
    tf = Column(String(10), nullable=False)
    ts = Column(DateTime(timezone=True), nullable=False)
    direction = Column(String(10), nullable=False)
    enter_at = Column(DateTime(timezone=True), nullable=False)
    expire_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint("direction IN ('UP', 'DOWN')", name="check_direction"),
        UniqueConstraint("symbol_id", "tf", "ts", name="unique_signal"),
    )
    
    symbol = relationship("Symbol", back_populates="signals")
    verdicts = relationship("Verdict", back_populates="signal")


class Verdict(Base):
    __tablename__ = "verdicts"
    
    id = Column(Integer, primary_key=True, index=True)
    signal_id = Column(Integer, ForeignKey("signals.id"), nullable=False)
    result = Column(String(10), nullable=False)
    settled_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint("result IN ('WIN', 'LOSS', 'SKIP')", name="check_result"),
    )
    
    signal = relationship("Signal", back_populates="verdicts")


class StatsRolling(Base):
    __tablename__ = "stats_rolling"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol_id = Column(Integer, ForeignKey("symbols.id"), nullable=False)
    tf = Column(String(10), nullable=False)
    window = Column(Integer, nullable=False, default=200)
    winrate = Column(Float, nullable=False, default=0.0)
    total_signals = Column(Integer, nullable=False, default=0)
    wins = Column(Integer, nullable=False, default=0)
    losses = Column(Integer, nullable=False, default=0)
    skips = Column(Integer, nullable=False, default=0)
    break_even_rate = Column(Float, nullable=False, default=0.5405)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint("symbol_id", "tf", "window", name="unique_stats"),
    )
    
    symbol = relationship("Symbol", back_populates="stats")



