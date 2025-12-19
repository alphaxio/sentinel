"""
Threat Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.threat import STRIDECategory, ThreatStatus


class ThreatBase(BaseModel):
    asset_id: UUID
    title: str
    stride_category: Optional[STRIDECategory] = None
    mitre_attack_id: Optional[str] = None
    likelihood_score: int = Field(..., ge=1, le=5)
    impact_score: int = Field(..., ge=1, le=5)


class ThreatCreate(ThreatBase):
    pass


class ThreatUpdate(BaseModel):
    title: Optional[str] = None
    stride_category: Optional[STRIDECategory] = None
    mitre_attack_id: Optional[str] = None
    likelihood_score: Optional[int] = Field(None, ge=1, le=5)
    impact_score: Optional[int] = Field(None, ge=1, le=5)
    status: Optional[ThreatStatus] = None


class ThreatResponse(ThreatBase):
    threat_id: UUID
    risk_score: float
    status: ThreatStatus
    auto_generated: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ThreatTransition(BaseModel):
    to_state: ThreatStatus
    comment: Optional[str] = None
