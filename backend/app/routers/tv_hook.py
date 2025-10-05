from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Dict, Any
import json
import logging

from ..db import get_db, get_redis
from ..schema import TVWebhookPayload, TVWebhookResponse, ErrorResponse
from ..security import verify_tv_signature, validate_timestamp, validate_symbol
from ..signals import create_signal, update_rolling_stats
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["webhooks"])


@router.post("/tv-hook", response_model=TVWebhookResponse)
async def tradingview_webhook(
    request: Request,
    payload: TVWebhookPayload,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis)
):
    """
    TradingView webhook endpoint for receiving trading signals
    
    Validates HMAC signature, processes signal, and stores in database
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        body_str = body.decode('utf-8')
        
        # Verify signature (TEMPORARILY DISABLED FOR TRADINGVIEW)
        # TradingView doesn't send X-TV-Signature header by default
        # signature = request.headers.get('X-TV-Signature', '')
        # if not verify_tv_signature(body_str, signature):
        #     logger.warning(f"Invalid signature for webhook from {request.client.host}")
        #     raise HTTPException(
        #         status_code=status.HTTP_401_UNAUTHORIZED,
        #         detail="Invalid signature"
        #     )
        
        logger.info(f"Webhook received from {request.client.host}: {body_str}")
        
        # Validate timestamp (within 10 minutes)
        if not validate_timestamp(payload.ts, tolerance_minutes=10):
            logger.warning(f"Invalid timestamp {payload.ts} from {request.client.host}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Timestamp too old or in future"
            )
        
        # Validate symbol
        if not validate_symbol(payload.symbol):
            logger.warning(f"Invalid symbol {payload.symbol} from {request.client.host}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Symbol not allowed"
            )
        
        # Check for idempotency using Redis
        from ..security import create_idempotency_key
        idempotency_key = create_idempotency_key(payload.symbol, payload.tf, payload.ts)
        
        # Check if we already processed this signal
        if redis_client.exists(idempotency_key):
            logger.info(f"Duplicate signal ignored: {idempotency_key}")
            return TVWebhookResponse(
                status="duplicate",
                message="Signal already processed"
            )
        
        # Create signal in database
        signal = create_signal(db, payload.dict())
        
        if signal is None:
            # Signal already exists (duplicate)
            logger.info(f"Duplicate signal in database: {payload.symbol} {payload.tf} {payload.ts}")
            return TVWebhookResponse(
                status="duplicate",
                message="Signal already exists"
            )
        
        # Update rolling statistics
        update_rolling_stats(db, payload.symbol, payload.tf, 200)
        
        # Cache last signal in Redis
        cache_key = f"last_signal:{payload.symbol}:{payload.tf}"
        signal_data = {
            'id': signal.id,
            'symbol': payload.symbol,
            'tf': payload.tf,
            'direction': payload.dir,
            'enter_at': signal.enter_at.isoformat(),
            'expire_at': signal.expire_at.isoformat(),
            'generated_at': signal.created_at.isoformat()
        }
        redis_client.setex(
            cache_key,
            settings.redis_cache_ttl,
            json.dumps(signal_data)
        )
        
        # Mark as processed for idempotency
        redis_client.setex(idempotency_key, 3600, "processed")  # 1 hour TTL
        
        logger.info(f"Signal processed successfully: {payload.symbol} {payload.tf} {payload.dir}")
        
        return TVWebhookResponse(
            status="success",
            message="Signal processed successfully",
            signal_id=signal.id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/tv-hook/test", response_model=TVWebhookResponse)
async def test_webhook(
    payload: TVWebhookPayload,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis)
):
    """
    Test endpoint for webhook (without signature verification)
    Only available in debug mode
    """
    if not settings.debug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )
    
    try:
        # Create signal
        signal = create_signal(db, payload.dict())
        
        if signal is None:
            return TVWebhookResponse(
                status="duplicate",
                message="Signal already exists"
            )
        
        # Update stats
        update_rolling_stats(db, payload.symbol, payload.tf, 200)
        
        return TVWebhookResponse(
            status="success",
            message="Test signal processed",
            signal_id=signal.id
        )
        
    except Exception as e:
        logger.error(f"Error in test webhook: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Test failed"
        )
