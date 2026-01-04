"""
Findings API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.models.finding import FindingSeverity, FindingStatus
from app.schemas.finding import FindingCreate, FindingUpdate, FindingResponse
from app.schemas.common import PaginatedResponse
from app.services.finding_service import (
    create_finding,
    get_finding,
    get_findings,
    update_finding,
    delete_finding,
    get_findings_by_asset,
    get_findings_by_threat
)

router = APIRouter()


@router.get("", response_model=PaginatedResponse[FindingResponse])
async def list_findings(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    severity: Optional[FindingSeverity] = Query(None),
    status: Optional[FindingStatus] = Query(None),
    asset_id: Optional[UUID] = Query(None),
    threat_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List findings with pagination"""
    skip = (page - 1) * page_size
    findings, total = get_findings(
        db,
        skip=skip,
        limit=page_size,
        search=search,
        severity=severity,
        status=status,
        asset_id=asset_id,
        threat_id=threat_id
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    # Populate asset_name from relationship
    finding_responses = []
    for finding in findings:
        finding_dict = FindingResponse.model_validate(finding).dict()
        finding_dict['asset_name'] = finding.asset.name if finding.asset else None
        finding_responses.append(FindingResponse(**finding_dict))
    
    return PaginatedResponse(
        items=finding_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{finding_id}", response_model=FindingResponse)
async def get_finding_by_id(
    finding_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get finding by ID"""
    finding = get_finding(db, finding_id)
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Finding with ID {finding_id} not found"
        )
    
    finding_dict = FindingResponse.model_validate(finding).dict()
    finding_dict['asset_name'] = finding.asset.name if finding.asset else None
    return FindingResponse(**finding_dict)


@router.post("", response_model=FindingResponse, status_code=201)
async def create_new_finding(
    finding_data: FindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("findings:write"))
):
    """Create a new finding"""
    finding = create_finding(db, finding_data)
    finding_dict = FindingResponse.model_validate(finding).dict()
    finding_dict['asset_name'] = finding.asset.name if finding.asset else None
    return FindingResponse(**finding_dict)


@router.patch("/{finding_id}", response_model=FindingResponse)
async def update_existing_finding(
    finding_id: UUID,
    finding_data: FindingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("findings:write"))
):
    """Update a finding"""
    finding = update_finding(db, finding_id, finding_data)
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Finding with ID {finding_id} not found"
        )
    
    finding_dict = FindingResponse.model_validate(finding).dict()
    finding_dict['asset_name'] = finding.asset.name if finding.asset else None
    return FindingResponse(**finding_dict)


@router.delete("/{finding_id}", status_code=204)
async def delete_existing_finding(
    finding_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("findings:write"))
):
    """Delete a finding"""
    success = delete_finding(db, finding_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Finding with ID {finding_id} not found"
        )
    return None


@router.get("/asset/{asset_id}", response_model=List[FindingResponse])
async def get_findings_for_asset(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all findings for a specific asset"""
    findings = get_findings_by_asset(db, asset_id)
    finding_responses = []
    for finding in findings:
        finding_dict = FindingResponse.model_validate(finding).dict()
        finding_dict['asset_name'] = finding.asset.name if finding.asset else None
        finding_responses.append(FindingResponse(**finding_dict))
    return finding_responses


@router.get("/threat/{threat_id}", response_model=List[FindingResponse])
async def get_findings_for_threat(
    threat_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all findings for a specific threat"""
    findings = get_findings_by_threat(db, threat_id)
    finding_responses = []
    for finding in findings:
        finding_dict = FindingResponse.model_validate(finding).dict()
        finding_dict['asset_name'] = finding.asset.name if finding.asset else None
        finding_responses.append(FindingResponse(**finding_dict))
    return finding_responses


