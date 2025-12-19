"""
Finding and Scan Result Models
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, ARRAY, Enum as SQLEnum, Text, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
import enum


class ScannerType(str, enum.Enum):
    SAST = "SAST"
    DAST = "DAST"
    SCA = "SCA"
    IAC = "IaC"


class ProcessingStatus(str, enum.Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"


class FindingSeverity(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    INFO = "Info"


class FindingStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In_Progress"
    REMEDIATED = "Remediated"
    FALSE_POSITIVE = "False_Positive"
    ACCEPTED = "Accepted"


class ScanResult(Base):
    __tablename__ = "scan_results"

    scan_result_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.asset_id"), nullable=False)
    scanner_type = Column(SQLEnum(ScannerType), nullable=False)
    scanner_name = Column(String, nullable=False)
    pipeline_run_id = Column(String, nullable=True)
    raw_data = Column(JSONB, nullable=False)
    processing_status = Column(SQLEnum(ProcessingStatus), nullable=False, default=ProcessingStatus.PENDING)
    scan_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)

    # Relationships
    asset = relationship("Asset")
    findings = relationship("Finding", back_populates="scan_result")


class Finding(Base):
    __tablename__ = "findings"

    finding_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_result_id = Column(UUID(as_uuid=True), ForeignKey("scan_results.scan_result_id"), nullable=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.asset_id"), nullable=False, index=True)
    threat_id = Column(UUID(as_uuid=True), ForeignKey("threats.threat_id"), nullable=True)
    vulnerability_type = Column(String, nullable=False)
    cve_id = Column(String, nullable=True)
    severity = Column(SQLEnum(FindingSeverity), nullable=False, index=True)
    location = Column(Text, nullable=True)
    status = Column(SQLEnum(FindingStatus), nullable=False, default=FindingStatus.OPEN, index=True)
    scanner_sources = Column(ARRAY(String), nullable=True)
    first_detected = Column(DateTime(timezone=True), server_default=func.now())
    remediated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    scan_result = relationship("ScanResult", back_populates="findings")
    asset = relationship("Asset", back_populates="findings")
    threat = relationship("Threat", back_populates="findings")
    policy_violations = relationship("PolicyViolation", back_populates="finding")



