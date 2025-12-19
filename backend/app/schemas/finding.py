"""
Finding Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.finding import FindingSeverity, FindingStatus


class FindingBase(BaseModel):
    asset_id: UUID
    vulnerability_type: str
    severity: FindingSeverity
    location: Optional[str] = None
    cve_id: Optional[str] = None


class FindingCreate(FindingBase):
    scan_result_id: Optional[UUID] = None
    threat_id: Optional[UUID] = None
    scanner_sources: Optional[List[str]] = None


class FindingUpdate(BaseModel):
    status: Optional[FindingStatus] = None
    threat_id: Optional[UUID] = None


class FindingResponse(FindingBase):
    finding_id: UUID
    scan_result_id: Optional[UUID]
    threat_id: Optional[UUID]
    status: FindingStatus
    scanner_sources: Optional[List[str]]
    first_detected: datetime
    remediated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
