"""
Policy Service - Business Logic
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime
from app.models.policy import PolicyRule, PolicyViolation, PolicyControlMapping, Control
from app.models.finding import Finding
from app.schemas.policy import PolicyRuleCreate, PolicyRuleUpdate
from app.models.policy import GateDecision


def create_policy_rule(db: Session, policy_data: PolicyRuleCreate) -> PolicyRule:
    """Create a new policy rule"""
    # Check if policy with same name exists
    existing = db.query(PolicyRule).filter(PolicyRule.name == policy_data.name).first()
    if existing:
        raise ValueError(f"Policy rule with name '{policy_data.name}' already exists")
    
    policy = PolicyRule(
        name=policy_data.name,
        description=policy_data.description,
        severity=policy_data.severity,
        rego_snippet=policy_data.rego_snippet,
        active=policy_data.active,
        version=1
    )
    
    db.add(policy)
    db.commit()
    db.refresh(policy)
    
    return policy


def get_policy_rule(db: Session, policy_id: UUID) -> Optional[PolicyRule]:
    """Get policy rule by ID"""
    return db.query(PolicyRule).filter(PolicyRule.policy_rule_id == policy_id).first()


def get_policy_rules(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    active_only: Optional[bool] = None,
    search: Optional[str] = None
) -> Tuple[List[PolicyRule], int]:
    """Get paginated list of policy rules"""
    query = db.query(PolicyRule)
    
    if active_only is not None:
        query = query.filter(PolicyRule.active == active_only)
    
    if search:
        query = query.filter(
            PolicyRule.name.ilike(f"%{search}%") |
            (PolicyRule.description.ilike(f"%{search}%") if PolicyRule.description else False)
        )
    
    total = query.count()
    policies = query.order_by(PolicyRule.created_at.desc()).offset(skip).limit(limit).all()
    
    return policies, total


def update_policy_rule(
    db: Session,
    policy_id: UUID,
    policy_data: PolicyRuleUpdate
) -> Optional[PolicyRule]:
    """Update a policy rule"""
    policy = get_policy_rule(db, policy_id)
    if not policy:
        return None
    
    if policy_data.name is not None:
        # Check if name is already taken by another policy
        existing = db.query(PolicyRule).filter(
            PolicyRule.name == policy_data.name,
            PolicyRule.policy_rule_id != policy_id
        ).first()
        if existing:
            raise ValueError(f"Policy rule with name '{policy_data.name}' already exists")
        policy.name = policy_data.name
    
    if policy_data.description is not None:
        policy.description = policy_data.description
    
    if policy_data.severity is not None:
        policy.severity = policy_data.severity
    
    if policy_data.rego_snippet is not None:
        policy.rego_snippet = policy_data.rego_snippet
        # Increment version when rego snippet changes
        policy.version += 1
    
    if policy_data.active is not None:
        policy.active = policy_data.active
    
    db.commit()
    db.refresh(policy)
    
    return policy


def delete_policy_rule(db: Session, policy_id: UUID) -> bool:
    """Delete a policy rule"""
    policy = get_policy_rule(db, policy_id)
    if not policy:
        return False
    
    db.delete(policy)
    db.commit()
    
    return True


def test_policy_rule(db: Session, policy_id: UUID, test_data: dict) -> dict:
    """
    Test a policy rule against test data
    For now, this is a placeholder - OPA integration would go here
    """
    policy = get_policy_rule(db, policy_id)
    if not policy:
        raise ValueError(f"Policy rule with ID {policy_id} not found")
    
    if not policy.active:
        return {
            "passed": False,
            "gate_decision": GateDecision.BLOCK,
            "message": "Policy is inactive"
        }
    
    # Basic validation - in production, this would use OPA to evaluate the rego_snippet
    # For now, we'll do a simple check
    if policy.rego_snippet:
        # Placeholder: In real implementation, this would call OPA
        # For now, return a basic response
        return {
            "passed": True,
            "gate_decision": GateDecision.PASS,
            "message": "Policy evaluation completed (OPA integration pending)"
        }
    else:
        return {
            "passed": True,
            "gate_decision": GateDecision.PASS,
            "message": "Policy has no Rego snippet defined"
        }


def get_policy_violations(
    db: Session,
    policy_id: Optional[UUID] = None,
    finding_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[PolicyViolation], int]:
    """Get policy violations with optional filters"""
    query = db.query(PolicyViolation)
    
    if policy_id:
        query = query.filter(PolicyViolation.policy_rule_id == policy_id)
    
    if finding_id:
        query = query.filter(PolicyViolation.finding_id == finding_id)
    
    total = query.count()
    violations = query.order_by(PolicyViolation.evaluated_at.desc()).offset(skip).limit(limit).all()
    
    return violations, total


def get_policy_statistics(db: Session, policy_id: UUID) -> dict:
    """Get statistics for a policy rule"""
    policy = get_policy_rule(db, policy_id)
    if not policy:
        return {}
    
    # Count violations
    violations_count = db.query(PolicyViolation).filter(
        PolicyViolation.policy_rule_id == policy_id
    ).count()
    
    # Count control mappings
    controls_count = db.query(PolicyControlMapping).filter(
        PolicyControlMapping.policy_rule_id == policy_id
    ).count()
    
    # Calculate pass rate (simplified - would need total evaluations)
    # For now, we'll use a placeholder calculation
    total_evaluations = violations_count + 10  # Placeholder
    pass_rate = ((total_evaluations - violations_count) / total_evaluations * 100) if total_evaluations > 0 else 100.0
    
    return {
        "violations_count": violations_count,
        "controls_mapped_count": controls_count,
        "pass_rate": round(pass_rate, 2)
    }


def evaluate_policy_for_finding(db: Session, policy_id: UUID, finding_id: UUID) -> Optional[PolicyViolation]:
    """
    Evaluate a policy against a finding and create a violation if needed
    This is a placeholder - real implementation would use OPA
    """
    policy = get_policy_rule(db, policy_id)
    finding = db.query(Finding).filter(Finding.finding_id == finding_id).first()
    
    if not policy or not finding:
        return None
    
    if not policy.active:
        return None
    
    # Placeholder evaluation logic
    # In production, this would:
    # 1. Prepare input data from the finding
    # 2. Call OPA with the policy's rego_snippet
    # 3. Create violation if policy fails
    
    # For now, we'll skip automatic evaluation
    return None

