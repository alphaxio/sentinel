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
    asset_name: Optional[str] = None  # Will be populated from relationship

    model_config = {"from_attributes": True}


class ThreatTransition(BaseModel):
    to_state: ThreatStatus
    comment: Optional[str] = None


# Threat Model Diagram Schemas
class ThreatModelDiagramBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    threat_id: Optional[UUID] = None


class ThreatModelDiagramCreate(ThreatModelDiagramBase):
    canvas_data: dict  # JSON structure with nodes and links


class ThreatModelDiagramUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    canvas_data: Optional[dict] = None


class ThreatModelDiagramResponse(ThreatModelDiagramBase):
    diagram_id: UUID
    canvas_data: dict
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    creator_name: Optional[str] = None  # Will be populated from relationship

    model_config = {"from_attributes": True}
