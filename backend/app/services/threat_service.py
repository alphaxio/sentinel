"""
Threat Service - Business Logic
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from app.models.threat import Threat, ThreatStateHistory, ThreatStatus
from app.models.asset import Asset
from app.schemas.threat import ThreatCreate, ThreatUpdate, ThreatTransition
from app.services.risk_service import RiskService


def calculate_risk_score(
    asset: Asset,
    likelihood_score: int,
    impact_score: int
) -> Decimal:
    """Calculate risk score: Asset Sensitivity × Threat Likelihood × Threat Impact"""
    sensitivity = float(asset.sensitivity_score)
    likelihood = float(likelihood_score)
    impact = float(impact_score)
    
    raw_score = sensitivity * likelihood * impact
    normalized = min(raw_score, 100.0)
    
    return Decimal(round(normalized, 2))


def create_threat(db: Session, threat_data: ThreatCreate, created_by_user_id: UUID) -> Threat:
    """Create a new threat with calculated risk score"""
    # Get the asset to calculate risk score
    asset = db.query(Asset).filter(Asset.asset_id == threat_data.asset_id).first()
    if not asset:
        raise ValueError(f"Asset with ID {threat_data.asset_id} not found")
    
    # Calculate risk score
    risk_score = calculate_risk_score(
        asset,
        threat_data.likelihood_score,
        threat_data.impact_score
    )
    
    threat = Threat(
        asset_id=threat_data.asset_id,
        title=threat_data.title,
        stride_category=threat_data.stride_category,
        mitre_attack_id=threat_data.mitre_attack_id,
        likelihood_score=threat_data.likelihood_score,
        impact_score=threat_data.impact_score,
        risk_score=risk_score,
        status=ThreatStatus.IDENTIFIED,
        auto_generated=False
    )
    
    db.add(threat)
    db.commit()
    db.refresh(threat)
    
    # Create initial state history entry
    state_history = ThreatStateHistory(
        threat_id=threat.threat_id,
        from_state=ThreatStatus.IDENTIFIED,
        to_state=ThreatStatus.IDENTIFIED,
        changed_by=created_by_user_id
    )
    db.add(state_history)
    db.commit()
    
    return threat


def get_threat(db: Session, threat_id: UUID) -> Optional[Threat]:
    """Get threat by ID"""
    return db.query(Threat).filter(Threat.threat_id == threat_id).first()


def get_threats(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[ThreatStatus] = None,
    asset_id: Optional[UUID] = None
) -> tuple[List[Threat], int]:
    """Get paginated list of threats"""
    query = db.query(Threat)
    
    if search:
        query = query.filter(Threat.title.ilike(f"%{search}%"))
    
    if status:
        query = query.filter(Threat.status == status)
    
    if asset_id:
        query = query.filter(Threat.asset_id == asset_id)
    
    total = query.count()
    threats = query.order_by(Threat.risk_score.desc()).offset(skip).limit(limit).all()
    
    return threats, total


def update_threat(
    db: Session,
    threat_id: UUID,
    threat_data: ThreatUpdate,
    current_user_id: UUID
) -> Optional[Threat]:
    """Update a threat"""
    threat = get_threat(db, threat_id)
    if not threat:
        return None
    
    update_data = threat_data.dict(exclude_unset=True)
    
    # If likelihood or impact changed, recalculate risk score
    if 'likelihood_score' in update_data or 'impact_score' in update_data:
        asset = db.query(Asset).filter(Asset.asset_id == threat.asset_id).first()
        if asset:
            likelihood = update_data.get('likelihood_score', threat.likelihood_score)
            impact = update_data.get('impact_score', threat.impact_score)
            update_data['risk_score'] = calculate_risk_score(asset, likelihood, impact)
    
    # Handle status transitions
    old_status = threat.status
    new_status = update_data.get('status')
    
    if new_status and new_status != old_status:
        # Validate state transition
        if not is_valid_transition(old_status, new_status):
            raise ValueError(f"Invalid state transition from {old_status} to {new_status}")
        
        # Create state history entry
        state_history = ThreatStateHistory(
            threat_id=threat_id,
            from_state=old_status,
            to_state=new_status,
            changed_by=current_user_id
        )
        db.add(state_history)
    
    for key, value in update_data.items():
        setattr(threat, key, value)
    
    db.commit()
    db.refresh(threat)
    return threat


def transition_threat_status(
    db: Session,
    threat_id: UUID,
    transition: ThreatTransition,
    current_user_id: UUID
) -> Optional[Threat]:
    """Transition threat to a new status"""
    threat = get_threat(db, threat_id)
    if not threat:
        return None
    
    old_status = threat.status
    new_status = transition.to_state
    
    # Validate transition
    if not is_valid_transition(old_status, new_status):
        raise ValueError(f"Invalid state transition from {old_status} to {new_status}")
    
    # Update status
    threat.status = new_status
    
    # Create state history entry
    state_history = ThreatStateHistory(
        threat_id=threat_id,
        from_state=old_status,
        to_state=new_status,
        changed_by=current_user_id
    )
    db.add(state_history)
    
    db.commit()
    db.refresh(threat)
    return threat


def is_valid_transition(from_status: ThreatStatus, to_status: ThreatStatus) -> bool:
    """Validate if a state transition is allowed"""
    # Same state is always valid (for initial creation)
    if from_status == to_status:
        return True
    
    # Define valid transitions
    valid_transitions = {
        ThreatStatus.IDENTIFIED: [ThreatStatus.ASSESSED, ThreatStatus.ACCEPTED],
        ThreatStatus.ASSESSED: [ThreatStatus.VERIFIED, ThreatStatus.ACCEPTED],
        ThreatStatus.VERIFIED: [ThreatStatus.EVALUATED, ThreatStatus.ACCEPTED],
        ThreatStatus.EVALUATED: [ThreatStatus.PLANNING, ThreatStatus.ACCEPTED],
        ThreatStatus.PLANNING: [ThreatStatus.MITIGATED, ThreatStatus.ACCEPTED],
        ThreatStatus.MITIGATED: [ThreatStatus.MONITORING, ThreatStatus.ACCEPTED],
        ThreatStatus.ACCEPTED: [ThreatStatus.MONITORING],
        ThreatStatus.MONITORING: [ThreatStatus.EVALUATED, ThreatStatus.ACCEPTED],
    }
    
    return to_status in valid_transitions.get(from_status, [])


def delete_threat(db: Session, threat_id: UUID) -> bool:
    """Delete a threat"""
    threat = get_threat(db, threat_id)
    if not threat:
        return False
    
    db.delete(threat)
    db.commit()
    return True


def get_threat_state_history(
    db: Session,
    threat_id: UUID
) -> List[ThreatStateHistory]:
    """Get state history for a threat"""
    return db.query(ThreatStateHistory).filter(
        ThreatStateHistory.threat_id == threat_id
    ).order_by(ThreatStateHistory.changed_at.desc()).all()

