"""
API v1 Router
"""
from fastapi import APIRouter
from app.api.v1.endpoints import assets, auth, threats, findings, risk_acceptances, policies

api_router = APIRouter()

api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(threats.router, prefix="/threats", tags=["Threats"])
api_router.include_router(findings.router, prefix="/findings", tags=["Findings"])
api_router.include_router(risk_acceptances.router, prefix="/risk-acceptances", tags=["Risk Acceptances"])
api_router.include_router(policies.router, prefix="/policies", tags=["Policies"])



