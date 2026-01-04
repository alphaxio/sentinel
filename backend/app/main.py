"""
Sentinel IRM Platform - FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="Sentinel IRM Platform API",
    description="Security orchestration platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
    return {"status": "healthy"}

