"""
Asset Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.asset import AssetType, ClassificationLevel


class AssetBase(BaseModel):
    name: str = Field(..., max_length=255)
    type: AssetType
    classification_level: ClassificationLevel
    owner_id: UUID
    confidentiality_score: int = Field(..., ge=1, le=5)
    integrity_score: int = Field(..., ge=1, le=5)
    availability_score: int = Field(..., ge=1, le=5)
    technology_stack: Optional[List[str]] = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    type: Optional[AssetType] = None
    classification_level: Optional[ClassificationLevel] = None
    owner_id: Optional[UUID] = None
    confidentiality_score: Optional[int] = Field(None, ge=1, le=5)
    integrity_score: Optional[int] = Field(None, ge=1, le=5)
    availability_score: Optional[int] = Field(None, ge=1, le=5)
    technology_stack: Optional[List[str]] = None


class AssetResponse(AssetBase):
    asset_id: UUID
    sensitivity_score: float
    created_at: datetime

    model_config = {"from_attributes": True}


class AssetRelationshipCreate(BaseModel):
    target_asset_id: UUID
    relationship_type: str


class AssetRelationshipResponse(BaseModel):
    relationship_id: UUID
    source_asset_id: UUID
    target_asset_id: UUID
    relationship_type: str
    source_asset: Optional[dict] = None
    target_asset: Optional[dict] = None

    model_config = {"from_attributes": True}


class BulkImportResponse(BaseModel):
    """Response for bulk import operation"""
    total: int
    created: int
    updated: int
    errors: List[str]
