from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base

class PostbackLog(Base):
    __tablename__ = "postback_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    event_type = Column(String, nullable=False, index=True)
    
    trader_id = Column(String, index=True)
    click_id = Column(String, index=True)
    
    deposit_sum = Column(Float, default=0.0)
    withdrawal_sum = Column(Float, default=0.0)
    commission = Column(Float, default=0.0)
    withdrawal_status = Column(String)
    
    country = Column(String)
    device_type = Column(String)
    os_version = Column(String)
    browser = Column(String)
    promo_code = Column(String)
    landing_type = Column(String)
    
    campaign_id = Column(String)
    campaign_name = Column(String)
    
    raw_data = Column(Text)
    
    event_datetime = Column(DateTime)
    received_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", backref="postback_logs")
    
    def __repr__(self):
        return f"<PostbackLog {self.event_type} trader_id={self.trader_id}>"

