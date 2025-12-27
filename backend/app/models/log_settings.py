from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class LogSettings(Base):
    __tablename__ = "log_settings"
    
    id = Column(Integer, primary_key=True)
    admin_id = Column(Integer, nullable=False)
    log_type = Column(String(50), nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LogType:
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    USER_REGISTER = "USER_REGISTER"
    EMAIL_VERIFIED = "EMAIL_VERIFIED"
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
    POCKET_OPTION_VERIFIED = "POCKET_OPTION_VERIFIED"
    SIGNAL_GENERATED = "SIGNAL_GENERATED"
    SIGNAL_VIEWED = "SIGNAL_VIEWED"
    VISITOR = "VISITOR"
    BALANCE_UPDATE = "BALANCE_UPDATE"
    IMPORTANT_ACTION = "IMPORTANT_ACTION"

    @classmethod
    def all_types(cls):
        return [
            cls.USER_LOGIN,
            cls.USER_LOGOUT,
            cls.USER_REGISTER,
            cls.EMAIL_VERIFIED,
            cls.PASSWORD_CHANGED,
            cls.POCKET_OPTION_VERIFIED,
            cls.SIGNAL_GENERATED,
            cls.SIGNAL_VIEWED,
            cls.VISITOR,
            cls.BALANCE_UPDATE,
            cls.IMPORTANT_ACTION
        ]

    @classmethod
    def get_display_name(cls, log_type):
        display_names = {
            cls.USER_LOGIN: "Вход пользователя",
            cls.USER_LOGOUT: "Выход пользователя",
            cls.USER_REGISTER: "Регистрация",
            cls.EMAIL_VERIFIED: "Подтверждение email",
            cls.PASSWORD_CHANGED: "Смена пароля",
            cls.POCKET_OPTION_VERIFIED: "Подтверждение Pocket Option",
            cls.SIGNAL_GENERATED: "Генерация сигнала",
            cls.SIGNAL_VIEWED: "Просмотр сигнала",
            cls.VISITOR: "Посетитель сайта",
            cls.BALANCE_UPDATE: "Пополнение баланса",
            cls.IMPORTANT_ACTION: "Важное действие"
        }
        return display_names.get(log_type, log_type)