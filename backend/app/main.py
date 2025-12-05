from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
import logging
import time
from contextlib import asynccontextmanager

from .config import settings
from .db import engine, Base, test_connections
from .routers import tv_hook, public, signal_generator, auth, test_email, pocket_option, postback, telegram

# Импортируем новый роутер для реального API
try:
    from .routers import pocket_option_api
except ImportError:
    pocket_option_api = None
try:
    from .routers import log_settings_api
except ImportError:
    log_settings_api = None
from .middleware.visitor_logging import VisitorLoggingMiddleware

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    
    if not test_connections():
        logger.error("Failed to connect to required services")
        raise RuntimeError("Failed to connect to required services")
    
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
    
    yield
    
    logger.info("Shutting down application")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Trading signals API with TradingView integration",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.debug else ["localhost", "127.0.0.1", "visionoftrading.com", "www.visionoftrading.com"]
)

app.add_middleware(VisitorLoggingMiddleware)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    client_host = request.client.host if request.client else "unknown"
    logger.info(f"{request.method} {request.url.path} - {client_host}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"Response {response.status_code} - {process_time:.3f}s")
    
    return response


app.include_router(tv_hook.router)
app.include_router(public.router)
app.include_router(signal_generator.router)
app.include_router(auth.router)
app.include_router(test_email.router)
app.include_router(pocket_option.router)

# Добавляем роутер для реального API Pocket Option
try:
    from .routers.pocket_option_api import router as pocket_option_api_router
    app.include_router(pocket_option_api_router)
    logger.info("Added real Pocket Option API router")
except ImportError as e:
    logger.warning(f"pocket_option_api router not available: {e}")


app.include_router(postback.router)
app.include_router(telegram.router)
try:
    app.include_router(log_settings_api.router)
except:
    pass


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": request.url.path
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else "Something went wrong"
        }
    )


@app.get("/health")
async def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        from .db import redis_client
        if redis_client:
            redis_client.ping()
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "version": settings.app_version,
            "database": "connected",
            "redis": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": time.time(),
                "version": settings.app_version,
                "error": str(e)
            }
        )


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else "Contact admin for API documentation"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
