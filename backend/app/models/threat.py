"""
Threat Models
"""
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, Boolean, Enum as SQLEnum, Text, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
import enum


class STRIDECategory(str, enum.Enum):
    SPOOFING = "Spoofing"
    TAMPERING = "Tampering"
    REPUDIATION = "Repudiation"
    INFO_DISCLOSURE = "Info_Disclosure"
    DOS = "DoS"
    ELEVATION = "Elevation"


class ThreatStatus(str, enum.Enum):
    IDENTIFIED = "Identified"
    ASSESSED = "Assessed"
    VERIFIED = "Verified"
    EVALUATED = "Evaluated"
    PLANNING = "Planning"
    MITIGATED = "Mitigated"
    ACCEPTED = "Accepted"
    MONITORING = "Monitoring"


class Threat(Base):
    __tablename__ = "threats"

    threat_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.asset_id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    stride_category = Column(SQLEnum(STRIDECategory), nullable=True)
    mitre_attack_id = Column(String, nullable=True)
    likelihood_score = Column(Integer, nullable=False)
    impact_score = Column(Integer, nullable=False)
    risk_score = Column(Numeric(5, 2), nullable=False, index=True)
    status = Column(SQLEnum(ThreatStatus), nullable=False, default=ThreatStatus.IDENTIFIED, index=True)
    auto_generated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    asset = relationship("Asset", back_populates="threats")
    state_history = relationship("ThreatStateHistory", back_populates="threat")
    risk_acceptances = relationship("RiskAcceptance", back_populates="threat")
    findings = relationship("Finding", back_populates="threat")


class ThreatStateHistory(Base):
    __tablename__ = "threat_state_history"

    history_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    threat_id = Column(UUID(as_uuid=True), ForeignKey("threats.threat_id"), nullable=False)
    from_state = Column(SQLEnum(ThreatStatus), nullable=False)
    to_state = Column(SQLEnum(ThreatStatus), nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    threat = relationship("Threat", back_populates="state_history")
    user = relationship("User", foreign_keys=[changed_by])


class ThreatModelDiagram(Base):
    __tablename__ = "threat_model_diagrams"

    diagram_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    threat_id = Column(UUID(as_uuid=True), ForeignKey("threats.threat_id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    # Store the entire canvas state as JSON
    canvas_data = Column(JSONB, nullable=False)  # Contains nodes, links, positions, etc.
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    threat = relationship("Threat", foreign_keys=[threat_id])
    creator = relationship("User", foreign_keys=[created_by])



