"""
Sentinel IRM Platform - FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting Sentinel IRM Platform API...")
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✓ Database connection verified")
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")
        # Don't crash - let the app start anyway
    
    logger.info("✓ Application startup complete")
    yield
    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title="Sentinel IRM Platform API",
    description="Security orchestration platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.api.v1.endpoints import assets, auth, threats, findings, risk_acceptances, policies

app.include_router(auth.router, prefix="/v1/auth", tags=["Authentication"])
app.include_router(assets.router, prefix="/v1/assets", tags=["Assets"])
app.include_router(threats.router, prefix="/v1/threats", tags=["Threats"])
app.include_router(findings.router, prefix="/v1/findings", tags=["Findings"])
app.include_router(risk_acceptances.router, prefix="/v1/risk-acceptances", tags=["Risk Acceptances"])
app.include_router(policies.router, prefix="/v1/policies", tags=["Policies"])


@app.get("/")
async def root():
    return {"message": "Sentinel IRM Platform API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint for Railway and load balancers"""
    try:
        # Quick database ping
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "version": "1.0.0"
        }, 503

