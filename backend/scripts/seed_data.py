#!/usr/bin/env python3
"""
Seed script to populate initial data
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models import Symbol, StatsRolling
from app.config import settings


def seed_symbols():
    """Seed initial trading symbols"""
    db = SessionLocal()
    try:
        # Add symbols from settings
        for symbol_name in settings.allowed_symbols:
            existing_symbol = db.query(Symbol).filter(Symbol.name == symbol_name.upper()).first()
            if not existing_symbol:
                symbol = Symbol(name=symbol_name.upper())
                db.add(symbol)
                print(f"Added symbol: {symbol_name}")
            else:
                print(f"Symbol already exists: {symbol_name}")
        
        db.commit()
        print("Symbols seeded successfully")
        
    except Exception as e:
        print(f"Error seeding symbols: {e}")
        db.rollback()
    finally:
        db.close()


def seed_initial_stats():
    """Seed initial statistics for all symbols"""
    db = SessionLocal()
    try:
        symbols = db.query(Symbol).all()
        timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']
        
        for symbol in symbols:
            for tf in timeframes:
                existing_stats = db.query(StatsRolling).filter(
                    StatsRolling.symbol_id == symbol.id,
                    StatsRolling.tf == tf,
                    StatsRolling.window == 200
                ).first()
                
                if not existing_stats:
                    stats = StatsRolling(
                        symbol_id=symbol.id,
                        tf=tf,
                        window=200,
                        winrate=0.0,
                        total_signals=0,
                        wins=0,
                        losses=0,
                        skips=0,
                        break_even_rate=0.5405
                    )
                    db.add(stats)
                    print(f"Added initial stats for {symbol.name} {tf}")
                else:
                    print(f"Stats already exist for {symbol.name} {tf}")
        
        db.commit()
        print("Initial statistics seeded successfully")
        
    except Exception as e:
        print(f"Error seeding stats: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """Main seeding function"""
    print("Starting data seeding...")
    
    # Create tables if they don't exist
    from app.models import Base
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified")
    
    # Seed symbols
    seed_symbols()
    
    # Seed initial stats
    seed_initial_stats()
    
    print("Data seeding completed!")


if __name__ == "__main__":
    main()
