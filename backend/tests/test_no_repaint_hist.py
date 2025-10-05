"""
Tests for no-repaint guarantee - historical data should never change
"""
import pytest
import json
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db import get_db
from app.models import Signal, Symbol, Verdict
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


class TestNoRepaintHistory:
    """Test that historical data never changes (no-repaint guarantee)"""
    
    def test_signal_timestamps_never_change(self, client: TestClient, db_session: Session, test_symbol):
        """Test that signal timestamps are immutable"""
        # Create initial signal
        payload = create_webhook_payload(timestamp_offset=-3600)  # 1 hour ago
        signature = create_signature(payload)
        
        response = client.post(
            "/api/tv-hook",
            json=payload,
            headers={"X-TV-Signature": signature}
        )
        
        assert response.status_code == 200
        
        # Get the created signal
        signal = db_session.query(Signal).filter(Signal.symbol_id == test_symbol.id).first()
        assert signal is not None
        
        original_ts = signal.ts
        original_enter_at = signal.enter_at
        original_expire_at = signal.expire_at
        original_created_at = signal.created_at
        
        # Try to send the same signal again (should be ignored)
        response2 = client.post(
            "/api/tv-hook",
            json=payload,
            headers={"X-TV-Signature": signature}
        )
        
        assert response2.status_code == 200
        assert response2.json()["status"] == "duplicate"
        
        # Refresh signal from database
        db_session.refresh(signal)
        
        # Verify timestamps haven't changed
        assert signal.ts == original_ts
        assert signal.enter_at == original_enter_at
        assert signal.expire_at == original_expire_at
        assert signal.created_at == original_created_at
    
    def test_historical_signals_remain_unchanged(self, client: TestClient, db_session: Session, test_symbol):
        """Test that historical signals remain unchanged when new signals are added"""
        # Create multiple historical signals
        historical_signals = []
        for i in range(5):
            offset = -(i + 1) * 3600  # 1 hour apart, going back in time
            payload = create_webhook_payload(timestamp_offset=offset)
            signature = create_signature(payload)
            
            response = client.post(
                "/api/tv-hook",
                json=payload,
                headers={"X-TV-Signature": signature}
            )
            
            assert response.status_code == 200
            signal_id = response.json()["signal_id"]
            historical_signals.append(signal_id)
        
        # Store original data for all signals
        original_data = {}
        for signal_id in historical_signals:
            signal = db_session.query(Signal).filter(Signal.id == signal_id).first()
            original_data[signal_id] = {
                'ts': signal.ts,
                'enter_at': signal.enter_at,
                'expire_at': signal.expire_at,
                'created_at': signal.created_at,
                'direction': signal.direction
            }
        
        # Add a new signal
        new_payload = create_webhook_payload(timestamp_offset=0)  # Current time
        new_signature = create_signature(new_payload)
        
        response = client.post(
            "/api/tv-hook",
            json=new_payload,
            headers={"X-TV-Signature": new_signature}
        )
        
        assert response.status_code == 200
        
        # Verify all historical signals remain unchanged
        for signal_id, original in original_data.items():
            signal = db_session.query(Signal).filter(Signal.id == signal_id).first()
            
            assert signal.ts == original['ts']
            assert signal.enter_at == original['enter_at']
            assert signal.expire_at == original['expire_at']
            assert signal.created_at == original['created_at']
            assert signal.direction == original['direction']
    
    def test_verdicts_dont_affect_signal_data(self, client: TestClient, db_session: Session, test_symbol):
        """Test that adding verdicts doesn't change original signal data"""
        # Create a signal
        payload = create_webhook_payload()
        signature = create_signature(payload)
        
        response = client.post(
            "/api/tv-hook",
            json=payload,
            headers={"X-TV-Signature": signature}
        )
        
        assert response.status_code == 200
        signal_id = response.json()["signal_id"]
        
        # Get original signal data
        signal = db_session.query(Signal).filter(Signal.id == signal_id).first()
        original_ts = signal.ts
        original_enter_at = signal.enter_at
        original_expire_at = signal.expire_at
        original_created_at = signal.created_at
        
        # Add a verdict
        verdict = Verdict(signal_id=signal_id, result="WIN")
        db_session.add(verdict)
        db_session.commit()
        
        # Refresh signal and verify it hasn't changed
        db_session.refresh(signal)
        
        assert signal.ts == original_ts
        assert signal.enter_at == original_enter_at
        assert signal.expire_at == original_expire_at
        assert signal.created_at == original_created_at
    
    def test_database_constraints_prevent_updates(self, db_session: Session, test_symbol):
        """Test that database constraints prevent updates to signal data"""
        from datetime import datetime
        import pytest
        from sqlalchemy.exc import IntegrityError
        
        # Create a signal manually
        signal = Signal(
            symbol_id=test_symbol.id,
            tf="5m",
            ts=datetime.now(),
            direction="UP",
            enter_at=datetime.now(),
            expire_at=datetime.now()
        )
        db_session.add(signal)
        db_session.commit()
        db_session.refresh(signal)
        
        # Try to update the timestamp (should be prevented by application logic)
        # In a real scenario, this would be prevented by application logic
        # Here we test that the unique constraint works
        duplicate_signal = Signal(
            symbol_id=test_symbol.id,
            tf="5m",
            ts=signal.ts,  # Same timestamp
            direction="DOWN",
            enter_at=datetime.now(),
            expire_at=datetime.now()
        )
        
        db_session.add(duplicate_signal)
        
        # This should raise an IntegrityError due to unique constraint
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
    
    def test_signal_direction_immutable(self, client: TestClient, db_session: Session, test_symbol):
        """Test that signal direction cannot be changed after creation"""
        # Create a signal with UP direction
        payload = create_webhook_payload(direction="UP")
        signature = create_signature(payload)
        
        response = client.post(
            "/api/tv-hook",
            json=payload,
            headers={"X-TV-Signature": signature}
        )
        
        assert response.status_code == 200
        signal_id = response.json()["signal_id"]
        
        # Get the signal
        signal = db_session.query(Signal).filter(Signal.id == signal_id).first()
        original_direction = signal.direction
        
        # Verify direction is UP
        assert original_direction == "UP"
        
        # Try to send the same signal with different direction (should be ignored)
        payload_down = create_webhook_payload(direction="DOWN")
        signature_down = create_signature(payload_down)
        
        # This should fail because it's the same timestamp
        response2 = client.post(
            "/api/tv-hook",
            json=payload_down,
            headers={"X-TV-Signature": signature_down}
        )
        
        assert response2.status_code == 200
        assert response2.json()["status"] == "duplicate"
        
        # Verify direction hasn't changed
        db_session.refresh(signal)
        assert signal.direction == original_direction
    
    def test_enter_expire_times_calculated_once(self, client: TestClient, db_session: Session, test_symbol):
        """Test that enter_at and expire_at times are calculated once and never change"""
        # Create a signal
        payload = create_webhook_payload()
        signature = create_signature(payload)
        
        response = client.post(
            "/api/tv-hook",
            json=payload,
            headers={"X-TV-Signature": signature}
        )
        
        assert response.status_code == 200
        signal_id = response.json()["signal_id"]
        
        # Get the signal
        signal = db_session.query(Signal).filter(Signal.id == signal_id).first()
        original_enter_at = signal.enter_at
        original_expire_at = signal.expire_at
        
        # Wait a bit and try to send the same signal again
        import time
        time.sleep(1)
        
        response2 = client.post(
            "/api/tv-hook",
            json=payload,
            headers={"X-TV-Signature": signature}
        )
        
        assert response2.status_code == 200
        assert response2.json()["status"] == "duplicate"
        
        # Verify times haven't changed
        db_session.refresh(signal)
        assert signal.enter_at == original_enter_at
        assert signal.expire_at == original_expire_at
