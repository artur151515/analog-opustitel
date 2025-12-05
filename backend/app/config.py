from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import List
import os
import json


class Settings(BaseSettings):
    database_url: str = "postgresql://visionoftrading:password@localhost:5432/visionoftrading"
    
    @property
    def async_database_url(self) -> str:
        return self.database_url.replace("postgresql://", "postgresql+asyncpg://")
    
    redis_url: str = "redis://localhost:6379"
    
    tv_webhook_secret: str = Field(default="your-super-secret-webhook-key-change-this", description="TradingView webhook secret key")
    secret_key: str = Field(default="your-secret-key-for-jwt-if-needed", description="JWT secret key")
    
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@tradevision.com"
    smtp_from_name: str = "Trade Vision"
    smtp_use_tls: bool = True
    
    allowed_symbols_raw: str = Field(
        default="CADJPY,GBPJPY,EURUSD,GBPUSD,USDJPY,EURJPY",
        description="Comma-separated list of allowed trading symbols"
    )
    
    app_name: str = "Vision of Trading"
    app_version: str = "1.0.0"
    debug: bool = False
    log_level: str = "INFO"
    
    cors_origins_raw: str = Field(
        default="http://localhost:3000,http://localhost:8000",
        description="Comma-separated list of allowed CORS origins"
    )
    
    redis_cache_ttl: int = 300
    max_signals_per_page: int = 100
    
    health_check_interval: int = 30
    
    @property
    def allowed_symbols(self) -> List[str]:
        if not self.allowed_symbols_raw:
            return []
        return [symbol.strip() for symbol in self.allowed_symbols_raw.split(',') if symbol.strip()]
    
    @property
    def cors_origins(self) -> List[str]:
        if not self.cors_origins_raw:
            return []
        return [origin.strip() for origin in self.cors_origins_raw.split(',') if origin.strip()]

    class Config:
        env_file = "../.env"
        case_sensitive = False
        env_ignore_empty = True


settings = Settings()


def get_settings() -> Settings:
    return settings

