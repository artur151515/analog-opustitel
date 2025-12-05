from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import redis
from .config import settings
import logging

logger = logging.getLogger(__name__)

try:
    engine = create_engine(
        settings.database_url,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
        echo=settings.debug,
        pool_pre_ping=True,
        pool_recycle=300,
    )
    logger.info(f"Database engine created successfully: {settings.database_url}")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
metadata = MetaData()

try:
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    logger.info(f"Redis client created successfully: {settings.redis_url}")
except Exception as e:
    logger.error(f"Failed to create Redis client: {e}")
    raise


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_redis():
    return redis_client


def test_connections():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection test successful")
        
        redis_client.ping()
        logger.info("Redis connection test successful")
        
        return True
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        return False

def create_tables():
    try:
        from .models import log_settings
        log_settings.Base.metadata.create_all(bind=engine)
        logger.info("Log settings tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create log settings tables: {e}")
        raise
