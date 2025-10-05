from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import redis
from .config import settings
import logging

logger = logging.getLogger(__name__)

# SQLAlchemy setup
try:
    engine = create_engine(
        settings.database_url,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
        echo=settings.debug,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=300,    # Recycle connections every 5 minutes
    )
    logger.info(f"Database engine created successfully: {settings.database_url}")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
metadata = MetaData()

# Redis setup
try:
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    logger.info(f"Redis client created successfully: {settings.redis_url}")
except Exception as e:
    logger.error(f"Failed to create Redis client: {e}")
    raise


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_redis():
    """Dependency to get Redis client"""
    return redis_client


def test_connections():
    """Test database and Redis connections"""
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection test successful")
        
        # Test Redis connection
        redis_client.ping()
        logger.info("Redis connection test successful")
        
        return True
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        return False
