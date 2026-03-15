from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import logging

from ..db import get_db
from ..models import User, PostbackLog
from ..models.trading import Signal, Symbol, StatsRolling, Verdict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    """Get all users for admin panel"""
    total = db.query(User).count()
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "pocket_option_id": u.pocket_option_id,
                "pocket_option_balance": u.pocket_option_balance or 0,
                "is_verified": bool(u.is_verified),
                "has_min_deposit": bool(u.has_min_deposit),
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_login": u.last_login.isoformat() if u.last_login else None,
            }
            for u in users
        ]
    }


@router.get("/stats")
async def get_admin_stats(db: Session = Depends(get_db)):
    """Quick stats overview for admin"""
    total_users = db.query(User).count()
    verified_users = db.query(User).filter(User.is_verified == True).count()
    deposited_users = db.query(User).filter(User.has_min_deposit == True).count()
    total_deposits = db.query(func.sum(User.pocket_option_balance)).filter(
        User.pocket_option_balance > 0
    ).scalar() or 0

    total_signals = db.query(Signal).count()
    total_postbacks = db.query(PostbackLog).count()

    return {
        "users": {
            "total": total_users,
            "verified": verified_users,
            "deposited": deposited_users,
        },
        "total_deposits": round(total_deposits, 2),
        "total_signals": total_signals,
        "total_postbacks": total_postbacks,
    }
