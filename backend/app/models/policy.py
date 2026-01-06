"""
Policy and Compliance Models
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
import enum


class ComplianceFramework(str, enum.Enum):
    NIST_800_53 = "NIST_800_53"
    ISO_27001 = "ISO_27001"
    PCI_DSS = "PCI_DSS"
    HIPAA = "HIPAA"
    GDPR = "GDPR"


class PolicySeverity(str, enum.Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class GateDecision(str, enum.Enum):
    PASS = "PASS"
    WARN = "WARN"
    BLOCK = "BLOCK"


class Control(Base):
    __tablename__ = "controls"

    control_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    framework = Column(SQLEnum(ComplianceFramework), nullable=False)
    control_code = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    # Relationships
    policy_mappings = relationship("PolicyControlMapping", back_populates="control")


class PolicyRule(Base):
    __tablename__ = "policy_rules"

    policy_rule_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(SQLEnum(PolicySeverity), nullable=False)
    rego_snippet = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    last_evaluated = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    control_mappings = relationship("PolicyControlMapping", back_populates="policy_rule")
    violations = relationship("PolicyViolation", back_populates="policy_rule")


class PolicyControlMapping(Base):
    __tablename__ = "policy_control_mappings"

    mapping_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_rule_id = Column(UUID(as_uuid=True), ForeignKey("policy_rules.policy_rule_id"), nullable=False)
    control_id = Column(UUID(as_uuid=True), ForeignKey("controls.control_id"), nullable=False)

    # Relationships
    policy_rule = relationship("PolicyRule", back_populates="control_mappings")
    control = relationship("Control", back_populates="policy_mappings")


class PolicyViolation(Base):
    __tablename__ = "policy_violations"

    violation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    finding_id = Column(UUID(as_uuid=True), ForeignKey("findings.finding_id"), nullable=False)
    policy_rule_id = Column(UUID(as_uuid=True), ForeignKey("policy_rules.policy_rule_id"), nullable=False)
    gate_decision = Column(SQLEnum(GateDecision), nullable=False)
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    finding = relationship("Finding", back_populates="policy_violations")
    policy_rule = relationship("PolicyRule", back_populates="violations")



