"""
Policies API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.schemas.policy import (
    PolicyRuleCreate,
    PolicyRuleUpdate,
    PolicyRuleResponse,
    PolicyViolationResponse,
    PolicyTestRequest,
    PolicyTestResponse
)
from app.schemas.common import PaginatedResponse
from app.services.policy_service import (
    create_policy_rule,
    get_policy_rule,
    get_policy_rules,
    update_policy_rule,
    delete_policy_rule,
    test_policy_rule,
    get_policy_violations,
    get_policy_statistics
)
from app.models.policy import GateDecision

router = APIRouter()


@router.get("", response_model=PaginatedResponse[PolicyRuleResponse])
async def list_policies(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    active_only: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List policy rules with pagination and filters"""
    skip = (page - 1) * page_size
    policies, total = get_policy_rules(
        db,
        skip=skip,
        limit=page_size,
        active_only=active_only,
        search=search
    )
    
    # Enrich with statistics
    policy_responses = []
    for policy in policies:
        stats = get_policy_statistics(db, policy.policy_rule_id)
        response = PolicyRuleResponse.model_validate(policy)
        response.violations_count = stats.get("violations_count", 0)
        response.controls_mapped_count = stats.get("controls_mapped_count", 0)
        response.pass_rate = stats.get("pass_rate")
        
        # Get framework from control mappings (if any)
        if policy.control_mappings:
            framework = policy.control_mappings[0].control.framework.value if policy.control_mappings[0].control else None
            response.framework = framework
        
        policy_responses.append(response)
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=policy_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{policy_id}", response_model=PolicyRuleResponse)
async def get_policy_by_id(
    policy_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific policy rule by ID"""
    policy = get_policy_rule(db, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy rule not found")
    
    stats = get_policy_statistics(db, policy_id)
    response = PolicyRuleResponse.model_validate(policy)
    response.violations_count = stats.get("violations_count", 0)
    response.controls_mapped_count = stats.get("controls_mapped_count", 0)
    response.pass_rate = stats.get("pass_rate")
    
    # Get framework from control mappings
    if policy.control_mappings:
        framework = policy.control_mappings[0].control.framework.value if policy.control_mappings[0].control else None
        response.framework = framework
    
    return response


@router.post("", response_model=PolicyRuleResponse, status_code=201)
async def create_new_policy(
    policy_data: PolicyRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("policies:write"))
):
    """Create a new policy rule"""
    try:
        policy = create_policy_rule(db, policy_data)
        
        response = PolicyRuleResponse.model_validate(policy)
        response.violations_count = 0
        response.controls_mapped_count = 0
        response.pass_rate = 100.0
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{policy_id}", response_model=PolicyRuleResponse)
async def update_existing_policy(
    policy_id: UUID,
    policy_data: PolicyRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("policies:write"))
):
    """Update a policy rule"""
    try:
        policy = update_policy_rule(db, policy_id, policy_data)
        if not policy:
            raise HTTPException(status_code=404, detail="Policy rule not found")
        
        stats = get_policy_statistics(db, policy_id)
        response = PolicyRuleResponse.model_validate(policy)
        response.violations_count = stats.get("violations_count", 0)
        response.controls_mapped_count = stats.get("controls_mapped_count", 0)
        response.pass_rate = stats.get("pass_rate")
        
        # Get framework from control mappings
        if policy.control_mappings:
            framework = policy.control_mappings[0].control.framework.value if policy.control_mappings[0].control else None
            response.framework = framework
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{policy_id}", status_code=204)
async def delete_existing_policy(
    policy_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("policies:write"))
):
    """Delete a policy rule"""
    if not delete_policy_rule(db, policy_id):
        raise HTTPException(status_code=404, detail="Policy rule not found")
    return None


@router.post("/{policy_id}/test", response_model=PolicyTestResponse)
async def test_policy(
    policy_id: UUID,
    test_request: PolicyTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test a policy rule against test data"""
    try:
        result = test_policy_rule(db, policy_id, test_request.test_data)
        
        return PolicyTestResponse(
            passed=result.get("passed", False),
            gate_decision=result.get("gate_decision", GateDecision.BLOCK),
            message=result.get("message")
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{policy_id}/violations", response_model=PaginatedResponse[PolicyViolationResponse])
async def get_policy_violations_endpoint(
    policy_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get violations for a specific policy"""
    policy = get_policy_rule(db, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy rule not found")
    
    skip = (page - 1) * page_size
    violations, total = get_policy_violations(
        db,
        policy_id=policy_id,
        skip=skip,
        limit=page_size
    )
    
    # Enrich with policy and finding names
    violation_responses = []
    for violation in violations:
        response = PolicyViolationResponse.model_validate(violation)
        response.policy_name = policy.name
        if violation.finding:
            response.finding_title = violation.finding.title
        violation_responses.append(response)
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=violation_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

