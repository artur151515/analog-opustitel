from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    balance = Column(Float, default=0.0)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    has_min_deposit = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    verification_token = Column(String, unique=True)
    reset_token = Column(String, unique=True)
    
    pocket_option_id = Column(String, unique=True, nullable=True)
    pocket_option_verified = Column(Boolean, default=False)
    pocket_option_balance = Column(Float, default=0.0)
    
    def __repr__(self):
        return f"<User {self.email}>"


