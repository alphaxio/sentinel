"""
Threats API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.schemas.threat import (
    ThreatCreate, ThreatUpdate, ThreatResponse, ThreatTransition,
    ThreatModelDiagramCreate, ThreatModelDiagramUpdate, ThreatModelDiagramResponse
)
from app.schemas.common import PaginatedResponse
from app.services.threat_service import (
    create_threat,
    get_threat,
    get_threats,
    update_threat,
    transition_threat_status,
    delete_threat,
    get_threat_state_history
)
from app.models.threat import ThreatStatus, ThreatModelDiagram

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ThreatResponse])
async def list_threats(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[ThreatStatus] = Query(None),
    asset_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List threats with pagination"""
    skip = (page - 1) * page_size
    threats, total = get_threats(
        db,
        skip=skip,
        limit=page_size,
        search=search,
        status=status,
        asset_id=asset_id
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    # Populate asset_name from relationship
    threat_responses = []
    for threat in threats:
        threat_dict = ThreatResponse.model_validate(threat).dict()
        threat_dict['asset_name'] = threat.asset.name if threat.asset else None
        threat_responses.append(ThreatResponse(**threat_dict))
    
    return PaginatedResponse(
        items=threat_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{threat_id}", response_model=ThreatResponse)
async def get_threat_by_id(
    threat_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get threat by ID"""
    threat = get_threat(db, threat_id)
    if not threat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Threat with ID {threat_id} not found"
        )
    
    threat_dict = ThreatResponse.model_validate(threat).dict()
    threat_dict['asset_name'] = threat.asset.name if threat.asset else None
    return ThreatResponse(**threat_dict)


@router.post("", response_model=ThreatResponse, status_code=201)
async def create_new_threat(
    threat_data: ThreatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("threats:write"))
):
    """Create a new threat"""
    try:
        threat = create_threat(db, threat_data, current_user.user_id)
        threat_dict = ThreatResponse.model_validate(threat).dict()
        threat_dict['asset_name'] = threat.asset.name if threat.asset else None
        return ThreatResponse(**threat_dict)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{threat_id}", response_model=ThreatResponse)
async def update_existing_threat(
    threat_id: UUID,
    threat_data: ThreatUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("threats:write"))
):
    """Update a threat"""
    try:
        threat = update_threat(db, threat_id, threat_data, current_user.user_id)
        if not threat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Threat with ID {threat_id} not found"
            )
        
        threat_dict = ThreatResponse.model_validate(threat).dict()
        threat_dict['asset_name'] = threat.asset.name if threat.asset else None
        return ThreatResponse(**threat_dict)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{threat_id}/transition", response_model=ThreatResponse)
async def transition_threat(
    threat_id: UUID,
    transition: ThreatTransition,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("threats:write"))
):
    """Transition threat to a new status"""
    try:
        threat = transition_threat_status(db, threat_id, transition, current_user.user_id)
        if not threat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Threat with ID {threat_id} not found"
            )
        
        threat_dict = ThreatResponse.model_validate(threat).dict()
        threat_dict['asset_name'] = threat.asset.name if threat.asset else None
        return ThreatResponse(**threat_dict)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{threat_id}", status_code=204)
async def delete_existing_threat(
    threat_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("threats:write"))
):
    """Delete a threat"""
    success = delete_threat(db, threat_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Threat with ID {threat_id} not found"
        )
    return None


@router.get("/{threat_id}/history")
async def get_threat_history(
    threat_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get state history for a threat"""
    # Verify threat exists
    threat = get_threat(db, threat_id)
    if not threat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Threat with ID {threat_id} not found"
        )
    
    history = get_threat_state_history(db, threat_id)
    
    # Convert to response format with user names
    history_items = []
    for item in history:
        history_items.append({
            "history_id": str(item.history_id),
            "threat_id": str(item.threat_id),
            "from_state": item.from_state.value,
            "to_state": item.to_state.value,
            "changed_by": str(item.changed_by),
            "changed_by_name": item.user.full_name if item.user else "Unknown",
            "changed_at": item.changed_at.isoformat(),
        })
    
    return history_items


@router.get("/analytics/risk-heatmap")
async def get_risk_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get risk heatmap data aggregated by likelihood and impact"""
    from sqlalchemy import func
    from app.models.threat import Threat
    
    # Aggregate threats by likelihood and impact
    results = db.query(
        Threat.likelihood_score,
        Threat.impact_score,
        func.count(Threat.threat_id).label('count')
    ).group_by(
        Threat.likelihood_score,
        Threat.impact_score
    ).all()
    
    # Calculate risk level for each cell
    heatmap_data = []
    for likelihood, impact, count in results:
        risk_score = (likelihood + impact) / 2 * 20  # Scale to 0-100
        
        if risk_score >= 80:
            risk_level = "critical"
        elif risk_score >= 60:
            risk_level = "high"
        elif risk_score >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        heatmap_data.append({
            "likelihood": likelihood,
            "impact": impact,
            "count": count,
            "risk": risk_level,
        })
    
    return heatmap_data


# Threat Model Diagram Endpoints
@router.post("/diagrams", response_model=ThreatModelDiagramResponse, status_code=status.HTTP_201_CREATED)
async def create_threat_model_diagram(
    diagram_data: ThreatModelDiagramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new threat model diagram"""
    diagram = ThreatModelDiagram(
        name=diagram_data.name,
        description=diagram_data.description,
        threat_id=diagram_data.threat_id,
        canvas_data=diagram_data.canvas_data,
        created_by=current_user.user_id
    )
    db.add(diagram)
    db.commit()
    db.refresh(diagram)
    
    # Get creator name
    response = ThreatModelDiagramResponse.model_validate(diagram)
    response.creator_name = current_user.email
    return response


@router.get("/diagrams", response_model=PaginatedResponse[ThreatModelDiagramResponse])
async def list_threat_model_diagrams(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    threat_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List threat model diagrams"""
    query = db.query(ThreatModelDiagram)
    
    if threat_id:
        query = query.filter(ThreatModelDiagram.threat_id == threat_id)
    
    total = query.count()
    skip = (page - 1) * page_size
    diagrams = query.order_by(ThreatModelDiagram.updated_at.desc()).offset(skip).limit(page_size).all()
    
    # Enrich with creator names
    diagram_responses = []
    for diagram in diagrams:
        # Use model_validate with from_attributes=True to properly convert SQLAlchemy model
        response = ThreatModelDiagramResponse.model_validate(diagram)
        if diagram.creator:
            response.creator_name = diagram.creator.email
        diagram_responses.append(response)
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=diagram_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/diagrams/{diagram_id}", response_model=ThreatModelDiagramResponse)
async def get_threat_model_diagram(
    diagram_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific threat model diagram"""
    diagram = db.query(ThreatModelDiagram).filter(ThreatModelDiagram.diagram_id == diagram_id).first()
    
    if not diagram:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Threat model diagram not found"
        )
    
    response = ThreatModelDiagramResponse.model_validate(diagram)
    if diagram.creator:
        response.creator_name = diagram.creator.email
    return response


@router.put("/diagrams/{diagram_id}", response_model=ThreatModelDiagramResponse)
async def update_threat_model_diagram(
    diagram_id: UUID,
    diagram_data: ThreatModelDiagramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a threat model diagram"""
    diagram = db.query(ThreatModelDiagram).filter(ThreatModelDiagram.diagram_id == diagram_id).first()
    
    if not diagram:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Threat model diagram not found"
        )
    
    # Check if user has permission (creator or admin)
    if diagram.created_by != current_user.user_id and (not current_user.role or current_user.role.role_name != "Admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this diagram"
        )
    
    if diagram_data.name is not None:
        diagram.name = diagram_data.name
    if diagram_data.description is not None:
        diagram.description = diagram_data.description
    if diagram_data.canvas_data is not None:
        diagram.canvas_data = diagram_data.canvas_data
    
    from sqlalchemy.sql import func
    diagram.updated_at = func.now()
    db.commit()
    db.refresh(diagram)
    
    response = ThreatModelDiagramResponse.model_validate(diagram)
    if diagram.creator:
        response.creator_name = diagram.creator.email
    return response


@router.delete("/diagrams/{diagram_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_threat_model_diagram(
    diagram_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a threat model diagram"""
    diagram = db.query(ThreatModelDiagram).filter(ThreatModelDiagram.diagram_id == diagram_id).first()
    
    if not diagram:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Threat model diagram not found"
        )
    
    # Check if user has permission (creator or admin)
    if diagram.created_by != current_user.user_id and (not current_user.role or current_user.role.role_name != "Admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this diagram"
        )
    
    db.delete(diagram)
    db.commit()
    return None


