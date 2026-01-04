"""
Policy Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.policy import PolicySeverity, ComplianceFramework, GateDecision


class PolicyRuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    severity: PolicySeverity
    rego_snippet: Optional[str] = None
    active: bool = True


class PolicyRuleCreate(PolicyRuleBase):
    pass


class PolicyRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    severity: Optional[PolicySeverity] = None
    rego_snippet: Optional[str] = None
    active: Optional[bool] = None


class PolicyRuleResponse(PolicyRuleBase):
    policy_rule_id: UUID
    version: int
    last_evaluated: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Enriched fields
    violations_count: int = 0
    controls_mapped_count: int = 0
    pass_rate: Optional[float] = None
    framework: Optional[str] = None

    model_config = {"from_attributes": True}


class ControlBase(BaseModel):
    framework: ComplianceFramework
    control_code: str
    description: str


class ControlCreate(ControlBase):
    pass


class ControlResponse(ControlBase):
    control_id: UUID

    model_config = {"from_attributes": True}


class PolicyControlMappingCreate(BaseModel):
    policy_rule_id: UUID
    control_id: UUID


class PolicyControlMappingResponse(BaseModel):
    mapping_id: UUID
    policy_rule_id: UUID
    control_id: UUID
    control: Optional[ControlResponse] = None

    model_config = {"from_attributes": True}


class PolicyViolationResponse(BaseModel):
    violation_id: UUID
    finding_id: UUID
    policy_rule_id: UUID
    gate_decision: GateDecision
    evaluated_at: datetime
    
    # Enriched fields
    policy_name: Optional[str] = None
    finding_title: Optional[str] = None

    model_config = {"from_attributes": True}


class PolicyTestRequest(BaseModel):
    """Request body for testing a policy"""
    test_data: dict = Field(..., description="Test data to evaluate against the policy")


class PolicyTestResponse(BaseModel):
    """Response from testing a policy"""
    passed: bool
    gate_decision: GateDecision
    message: Optional[str] = None
    violations: Optional[List[dict]] = None

