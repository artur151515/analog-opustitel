from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import List
import os
import json


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://opustoshitel:password@localhost:5432/opustoshitel"
    
    @property
    def async_database_url(self) -> str:
        """Get async database URL for migrations"""
        return self.database_url.replace("postgresql://", "postgresql+asyncpg://")
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Security
    tv_webhook_secret: str = "your-super-secret-webhook-key-change-this"
    secret_key: str = "your-secret-key-for-jwt-if-needed"
    
    # Email settings
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@tradevision.com"
    smtp_from_name: str = "Trade Vision"
    
    # Allowed symbols
    allowed_symbols_raw: str = Field(
        default="CADJPY,GBPJPY,EURUSD,GBPUSD,USDJPY,EURJPY",
        description="Comma-separated list of allowed trading symbols"
    )
    
    # Application
    app_name: str = "Opustoshitel TV"
    app_version: str = "1.0.0"
    debug: bool = False
    log_level: str = "INFO"
    
    # CORS
    cors_origins_raw: str = Field(
        default="http://localhost:3000,http://localhost:8000",
        description="Comma-separated list of allowed CORS origins"
    )
    
    # Performance
    redis_cache_ttl: int = 300  # 5 minutes
    max_signals_per_page: int = 100
    
    # Monitoring
    health_check_interval: int = 30
    
    @property
    def allowed_symbols(self) -> List[str]:
        """Parse allowed symbols from comma-separated string"""
        if not self.allowed_symbols_raw:
            return []
        return [symbol.strip() for symbol in self.allowed_symbols_raw.split(',') if symbol.strip()]
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        if not self.cors_origins_raw:
            return []
        return [origin.strip() for origin in self.cors_origins_raw.split(',') if origin.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = False
        env_ignore_empty = True


settings = Settings()


def get_settings() -> Settings:
    return settings
