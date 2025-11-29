from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base

class PostbackLog(Base):
    """Логи всех постбеков от Pocket Partners"""
    __tablename__ = "postback_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Событие
    event_type = Column(String, nullable=False, index=True)  # registration, email_confirmed, ftd, repeat_deposit, commission, withdrawal
    
    # Данные трейдера
    trader_id = Column(String, index=True)  # ID трейдера в Pocket Option
    click_id = Column(String, index=True)  # Уникальный ID клика
    
    # Финансовые данные
    deposit_sum = Column(Float, default=0.0)  # Сумма депозита
    withdrawal_sum = Column(Float, default=0.0)  # Сумма вывода
    commission = Column(Float, default=0.0)  # Комиссия
    withdrawal_status = Column(String)  # Статус вывода
    
    # Метаданные
    country = Column(String)
    device_type = Column(String)
    os_version = Column(String)
    browser = Column(String)
    promo_code = Column(String)
    landing_type = Column(String)
    
    # Кампания
    campaign_id = Column(String)
    campaign_name = Column(String)
    
    # Полные данные запроса (для отладки)
    raw_data = Column(Text)
    
    # Timestamps
    event_datetime = Column(DateTime)  # Время события от Pocket Partners
    received_at = Column(DateTime, default=datetime.utcnow)  # Время получения постбека
    
    # Связь с пользователем
    user = relationship("User", backref="postback_logs")
    
    def __repr__(self):
        return f"<PostbackLog {self.event_type} trader_id={self.trader_id}>"

