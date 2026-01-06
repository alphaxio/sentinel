"""
Risk Acceptance Model
"""
from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
import enum


class RiskAcceptanceStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class RiskAcceptance(Base):
    __tablename__ = "risk_acceptances"

    acceptance_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    threat_id = Column(UUID(as_uuid=True), ForeignKey("threats.threat_id"), nullable=False)
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    justification = Column(Text, nullable=False)
    acceptance_period_days = Column(Integer, nullable=False)
    expiration_date = Column(Date, nullable=False)
    status = Column(SQLEnum(RiskAcceptanceStatus), nullable=False, default=RiskAcceptanceStatus.PENDING)
    approval_signature_name = Column(String, nullable=True)
    approval_signature_timestamp = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    threat = relationship("Threat", back_populates="risk_acceptances")
    requester = relationship("User", foreign_keys=[requested_by])
    approver = relationship("User", foreign_keys=[approved_by])



