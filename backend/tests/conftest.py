"""
Pytest configuration and fixtures
"""
import pytest
import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Set test environment
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/1"  # Use different Redis DB for tests
os.environ["TV_WEBHOOK_SECRET"] = "test-secret-key"

from app.main import app
from app.db import get_db, Base
from app.models import *


@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine"""
    engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture(scope="function")
def test_db_session(test_engine):
    """Create test database session"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = SessionLocal()
    
    # Clean up all tables before each test
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()
    
    yield session
    session.close()


@pytest.fixture(scope="function")
def client(test_db_session):
    """Create test client with database session override"""
    def override_get_db():
        yield test_db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_symbol(test_db_session):
    """Create a sample symbol for testing"""
    symbol = Symbol(name="TESTJPY")
    test_db_session.add(symbol)
    test_db_session.commit()
    test_db_session.refresh(symbol)
    return symbol


@pytest.fixture
def sample_signal(test_db_session, sample_symbol):
    """Create a sample signal for testing"""
    from datetime import datetime, timedelta
    
    signal = Signal(
        symbol_id=sample_symbol.id,
        tf="5m",
        ts=datetime.now(),
        direction="UP",
        enter_at=datetime.now() + timedelta(seconds=60),
        expire_at=datetime.now() + timedelta(seconds=360)
    )
    test_db_session.add(signal)
    test_db_session.commit()
    test_db_session.refresh(signal)
    return signal
