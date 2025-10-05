"""
Tests for idempotency of signal processing
"""
import pytest
import json
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db import get_db
from app.models import Signal, Symbol
from app.config import settings


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def db_session():
    """Create test database session"""
    from app.db import SessionLocal
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_symbol(db_session: Session):
    """Create test symbol"""
    symbol = Symbol(name="TESTJPY")
    db_session.add(symbol)
    db_session.commit()
    db_session.refresh(symbol)
    return symbol


def create_webhook_payload(symbol="TESTJPY", tf="5m", direction="UP", timestamp_offset=0):
    """Create test webhook payload"""
    timestamp = int((datetime.now() + timedelta(seconds=timestamp_offset)).timestamp() * 1000)
    return {
        "ts": timestamp,
        "symbol": symbol,
        "tf": tf,
        "dir": direction
    }


def create_signature(payload: dict) -> str:
    """Create test signature (for testing purposes)"""
    import hmac
    import hashlib
    
    payload_str = json.dumps(payload)
    signature = hmac.new(
        settings.tv_webhook_secret.encode('utf-8'),
        payload_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature


class TestIdempotency:
    """Test idempotency of signal processing"""
    
    def test_duplicate_signal_not_created(self, client: TestClient, db_session: Session, test_symbol):
        """Test that duplicate signals are not created"""
        payload = create_webhook_payload()
        signature = create_signature(payload)
        
        # First request
        response1 = client.post(
            "/api/tv-hook",
            json=payload,
            headers={"X-TV-Signature": signature}
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["status"] == "success"
        assert data1["signal_id"] is not None
        
        # Count signals before second request
        initial_count = db_session.query(Signal).count()
        
        # Second request with same payload
        response2 = client.post(
            "/api/tv-hook",
            json=payload,
            headers={"X-TV-Signature": signature}
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["status"] == "duplicate"
        assert data2["signal_id"] is None
        
        # Verify no new signal was created
        final_count = db_session.query(Signal).count()
        assert final_count == initial_count
    
    def test_different_timestamps_create_different_signals(self, client: TestClient, db_session: Session, test_symbol):
        """Test that signals with different timestamps are created separately"""
        # First signal
        payload1 = create_webhook_payload(timestamp_offset=-300)  # 5 minutes ago
        signature1 = create_signature(payload1)
        
        response1 = client.post(
            "/api/tv-hook",
            json=payload1,
            headers={"X-TV-Signature": signature1}
        )
        
        assert response1.status_code == 200
        assert response1.json()["status"] == "success"
        
        # Second signal with different timestamp
        payload2 = create_webhook_payload(timestamp_offset=-200)  # Different time
        signature2 = create_signature(payload2)
        
        response2 = client.post(
            "/api/tv-hook",
            json=payload2,
            headers={"X-TV-Signature": signature2}
        )
        
        assert response2.status_code == 200
        assert response2.json()["status"] == "success"
        
        # Verify both signals were created
        signals = db_session.query(Signal).filter(Signal.symbol_id == test_symbol.id).all()
        assert len(signals) == 2
    
    def test_different_symbols_create_different_signals(self, client: TestClient, db_session: Session, test_symbol):
        """Test that signals for different symbols are created separately"""
        # Create second symbol
        symbol2 = Symbol(name="TESTUSD")
        db_session.add(symbol2)
        db_session.commit()
        db_session.refresh(symbol2)
        
        # First signal for TESTJPY
        payload1 = create_webhook_payload(symbol="TESTJPY")
        signature1 = create_signature(payload1)
        
        response1 = client.post(
            "/api/tv-hook",
            json=payload1,
            headers={"X-TV-Signature": signature1}
        )
        
        assert response1.status_code == 200
        assert response1.json()["status"] == "success"
        
        # Second signal for TESTUSD
        payload2 = create_webhook_payload(symbol="TESTUSD")
        signature2 = create_signature(payload2)
        
        response2 = client.post(
            "/api/tv-hook",
            json=payload2,
            headers={"X-TV-Signature": signature2}
        )
        
        assert response2.status_code == 200
        assert response2.json()["status"] == "success"
        
        # Verify signals were created for both symbols
        signals_jpy = db_session.query(Signal).join(Symbol).filter(Symbol.name == "TESTJPY").all()
        signals_usd = db_session.query(Signal).join(Symbol).filter(Symbol.name == "TESTUSD").all()
        
        assert len(signals_jpy) == 1
        assert len(signals_usd) == 1
    
    def test_different_timeframes_create_different_signals(self, client: TestClient, db_session: Session, test_symbol):
        """Test that signals for different timeframes are created separately"""
        # First signal for 5m
        payload1 = create_webhook_payload(tf="5m")
        signature1 = create_signature(payload1)
        
        response1 = client.post(
            "/api/tv-hook",
            json=payload1,
            headers={"X-TV-Signature": signature1}
        )
        
        assert response1.status_code == 200
        assert response1.json()["status"] == "success"
        
        # Second signal for 15m
        payload2 = create_webhook_payload(tf="15m")
        signature2 = create_signature(payload2)
        
        response2 = client.post(
            "/api/tv-hook",
            json=payload2,
            headers={"X-TV-Signature": signature2}
        )
        
        assert response2.status_code == 200
        assert response2.json()["status"] == "success"
        
        # Verify signals were created for both timeframes
        signals_5m = db_session.query(Signal).filter(
            Signal.symbol_id == test_symbol.id,
            Signal.tf == "5m"
        ).all()
        signals_15m = db_session.query(Signal).filter(
            Signal.symbol_id == test_symbol.id,
            Signal.tf == "15m"
        ).all()
        
        assert len(signals_5m) == 1
        assert len(signals_15m) == 1
    
    def test_redis_idempotency_key(self, client: TestClient, db_session: Session, test_symbol):
        """Test that Redis idempotency key prevents duplicate processing"""
        payload = create_webhook_payload()
        signature = create_signature(payload)
        
        # First request
        response1 = client.post(
            "/api/tv-hook",
            json=payload,
            headers={"X-TV-Signature": signature}
        )
        
        assert response1.status_code == 200
        assert response1.json()["status"] == "success"
        
        # Second request should return duplicate immediately (Redis check)
        response2 = client.post(
            "/api/tv-hook",
            json=payload,
            headers={"X-TV-Signature": signature}
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["status"] == "duplicate"
    
    def test_invalid_signature_rejected(self, client: TestClient, db_session: Session, test_symbol):
        """Test that requests with invalid signatures are rejected"""
        payload = create_webhook_payload()
        
        # Request with invalid signature
        response = client.post(
            "/api/tv-hook",
            json=payload,
            headers={"X-TV-Signature": "invalid-signature"}
        )
        
        assert response.status_code == 401
        assert "Invalid signature" in response.json()["detail"]
        
        # Verify no signal was created
        signals = db_session.query(Signal).filter(Signal.symbol_id == test_symbol.id).all()
        assert len(signals) == 0
    
    def test_missing_signature_rejected(self, client: TestClient, db_session: Session, test_symbol):
        """Test that requests without signature are rejected"""
        payload = create_webhook_payload()
        
        # Request without signature header
        response = client.post(
            "/api/tv-hook",
            json=payload
        )
        
        assert response.status_code == 401
        assert "Invalid signature" in response.json()["detail"]
        
        # Verify no signal was created
        signals = db_session.query(Signal).filter(Signal.symbol_id == test_symbol.id).all()
        assert len(signals) == 0
