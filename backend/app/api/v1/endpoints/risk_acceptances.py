"""
Risk Acceptances API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.models.risk import RiskAcceptanceStatus
from app.schemas.risk import (
    RiskAcceptanceCreate,
    RiskAcceptanceUpdate,
    RiskAcceptanceResponse
)
from app.schemas.common import PaginatedResponse
from pydantic import BaseModel


class ApproveRequest(BaseModel):
    approval_signature_name: Optional[str] = None
from app.services.risk_acceptance_service import (
    create_risk_acceptance,
    get_risk_acceptance,
    get_risk_acceptances,
    update_risk_acceptance,
    delete_risk_acceptance,
    approve_risk_acceptance,
    reject_risk_acceptance
)

router = APIRouter()


@router.get("", response_model=PaginatedResponse[RiskAcceptanceResponse])
async def list_risk_acceptances(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    threat_id: Optional[UUID] = Query(None),
    status: Optional[RiskAcceptanceStatus] = Query(None),
    requested_by: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List risk acceptances with pagination"""
    skip = (page - 1) * page_size
    acceptances, total = get_risk_acceptances(
        db,
        skip=skip,
        limit=page_size,
        threat_id=threat_id,
        status=status,
        requested_by=requested_by
    )
    
    # Enrich with user and threat names
    acceptance_responses = []
    for acceptance in acceptances:
        response = RiskAcceptanceResponse.model_validate(acceptance)
        if acceptance.requester:
            response.requester_name = acceptance.requester.email
        if acceptance.approver:
            response.approver_name = acceptance.approver.email
        if acceptance.threat:
            response.threat_title = acceptance.threat.title
            response.threat_risk_score = float(acceptance.threat.risk_score)
        acceptance_responses.append(response)
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=acceptance_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{acceptance_id}", response_model=RiskAcceptanceResponse)
async def get_risk_acceptance_by_id(
    acceptance_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get risk acceptance by ID"""
    acceptance = get_risk_acceptance(db, acceptance_id)
    if not acceptance:
        raise HTTPException(status_code=404, detail="Risk acceptance not found")
    
    response = RiskAcceptanceResponse.model_validate(acceptance)
    if acceptance.requester:
        response.requester_name = acceptance.requester.email
    if acceptance.approver:
        response.approver_name = acceptance.approver.email
    if acceptance.threat:
        response.threat_title = acceptance.threat.title
        response.threat_risk_score = float(acceptance.threat.risk_score)
    
    return response


@router.post("", response_model=RiskAcceptanceResponse, status_code=201)
async def create_new_risk_acceptance(
    acceptance_data: RiskAcceptanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new risk acceptance request"""
    try:
        acceptance = create_risk_acceptance(
            db,
            acceptance_data,
            current_user.user_id
        )
        
        response = RiskAcceptanceResponse.model_validate(acceptance)
        if acceptance.requester:
            response.requester_name = acceptance.requester.email
        if acceptance.threat:
            response.threat_title = acceptance.threat.title
            response.threat_risk_score = float(acceptance.threat.risk_score)
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{acceptance_id}", response_model=RiskAcceptanceResponse)
async def update_existing_risk_acceptance(
    acceptance_id: UUID,
    acceptance_data: RiskAcceptanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("risk_acceptances:write"))
):
    """Update a risk acceptance"""
    acceptance = update_risk_acceptance(db, acceptance_id, acceptance_data)
    if not acceptance:
        raise HTTPException(status_code=404, detail="Risk acceptance not found")
    
    response = RiskAcceptanceResponse.model_validate(acceptance)
    if acceptance.requester:
        response.requester_name = acceptance.requester.email
    if acceptance.approver:
        response.approver_name = acceptance.approver.email
    if acceptance.threat:
        response.threat_title = acceptance.threat.title
        response.threat_risk_score = float(acceptance.threat.risk_score)
    
    return response


@router.post("/{acceptance_id}/approve", response_model=RiskAcceptanceResponse)
async def approve_risk_acceptance_request(
    acceptance_id: UUID,
    request: Optional[ApproveRequest] = Body(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve a risk acceptance request"""
    try:
        signature_name = (request.approval_signature_name if request else None) or current_user.email
        acceptance = approve_risk_acceptance(
            db,
            acceptance_id,
            current_user.user_id,
            signature_name
        )
        if not acceptance:
            raise HTTPException(status_code=404, detail="Risk acceptance not found")
        
        response = RiskAcceptanceResponse.model_validate(acceptance)
        if acceptance.requester:
            response.requester_name = acceptance.requester.email
        if acceptance.approver:
            response.approver_name = acceptance.approver.email
        if acceptance.threat:
            response.threat_title = acceptance.threat.title
            response.threat_risk_score = float(acceptance.threat.risk_score)
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{acceptance_id}/reject", response_model=RiskAcceptanceResponse)
async def reject_risk_acceptance_request(
    acceptance_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("risk_acceptances:approve"))
):
    """Reject a risk acceptance request"""
    try:
        acceptance = reject_risk_acceptance(
            db,
            acceptance_id,
            current_user.user_id
        )
        if not acceptance:
            raise HTTPException(status_code=404, detail="Risk acceptance not found")
        
        response = RiskAcceptanceResponse.model_validate(acceptance)
        if acceptance.requester:
            response.requester_name = acceptance.requester.email
        if acceptance.approver:
            response.approver_name = acceptance.approver.email
        if acceptance.threat:
            response.threat_title = acceptance.threat.title
            response.threat_risk_score = float(acceptance.threat.risk_score)
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{acceptance_id}", status_code=204)
async def delete_existing_risk_acceptance(
    acceptance_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("risk_acceptances:write"))
):
    """Delete a risk acceptance"""
    success = delete_risk_acceptance(db, acceptance_id)
    if not success:
        raise HTTPException(status_code=404, detail="Risk acceptance not found")

