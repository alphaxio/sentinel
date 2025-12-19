"""
Asset Models
"""
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, ARRAY, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
import enum


class AssetType(str, enum.Enum):
    APPLICATION = "Application"
    MICROSERVICE = "Microservice"
    DATABASE = "Database"
    CONTAINER = "Container"
    INFRASTRUCTURE = "Infrastructure"
    SERVER = "Server"
    NETWORK = "Network"
    CLOUD = "Cloud"


class ClassificationLevel(str, enum.Enum):
    PUBLIC = "Public"
    INTERNAL = "Internal"
    CONFIDENTIAL = "Confidential"
    RESTRICTED = "Restricted"


class RelationshipType(str, enum.Enum):
    DEPENDS_ON = "depends_on"
    COMMUNICATES_WITH = "communicates_with"
    PROCESSES_DATA_FROM = "processes_data_from"


class Asset(Base):
    __tablename__ = "assets"

    asset_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False, index=True)
    type = Column(SQLEnum(AssetType), nullable=False)
    classification_level = Column(SQLEnum(ClassificationLevel), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False, index=True)
    confidentiality_score = Column(Integer, nullable=False)
    integrity_score = Column(Integer, nullable=False)
    availability_score = Column(Integer, nullable=False)
    sensitivity_score = Column(Numeric(5, 2), nullable=False, index=True)
    technology_stack = Column(ARRAY(String), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    threats = relationship("Threat", back_populates="asset")
    findings = relationship("Finding", back_populates="asset")
    source_relationships = relationship(
        "AssetRelationship",
        foreign_keys="AssetRelationship.source_asset_id",
        back_populates="source_asset"
    )
    target_relationships = relationship(
        "AssetRelationship",
        foreign_keys="AssetRelationship.target_asset_id",
        back_populates="target_asset"
    )


class AssetRelationship(Base):
    __tablename__ = "asset_relationships"

    relationship_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.asset_id"), nullable=False)
    target_asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.asset_id"), nullable=False)
    relationship_type = Column(SQLEnum(RelationshipType), nullable=False)

    # Relationships
    source_asset = relationship("Asset", foreign_keys=[source_asset_id], back_populates="source_relationships")
    target_asset = relationship("Asset", foreign_keys=[target_asset_id], back_populates="target_relationships")



