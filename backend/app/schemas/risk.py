"""
Risk Acceptance Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from uuid import UUID
from app.models.risk import RiskAcceptanceStatus


class RiskAcceptanceBase(BaseModel):
    threat_id: UUID
    justification: str = Field(..., min_length=10, max_length=2000)
    acceptance_period_days: int = Field(..., ge=1, le=90)


class RiskAcceptanceCreate(RiskAcceptanceBase):
    pass


class RiskAcceptanceUpdate(BaseModel):
    justification: Optional[str] = Field(None, min_length=10, max_length=2000)
    acceptance_period_days: Optional[int] = Field(None, ge=1, le=90)
    status: Optional[RiskAcceptanceStatus] = None


class RiskAcceptanceResponse(RiskAcceptanceBase):
    acceptance_id: UUID
    requested_by: UUID
    approved_by: Optional[UUID] = None
    expiration_date: date
    status: RiskAcceptanceStatus
    approval_signature_name: Optional[str] = None
    approval_signature_timestamp: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Enriched fields
    requester_name: Optional[str] = None
    approver_name: Optional[str] = None
    threat_title: Optional[str] = None
    threat_risk_score: Optional[float] = None

    model_config = {"from_attributes": True}

