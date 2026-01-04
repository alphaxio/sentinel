"""
Risk Acceptance Service - Business Logic
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import date, datetime, timedelta
from app.models.risk import RiskAcceptance, RiskAcceptanceStatus
from app.models.threat import Threat
from app.models.user import User
from app.schemas.risk import RiskAcceptanceCreate, RiskAcceptanceUpdate


def create_risk_acceptance(
    db: Session,
    acceptance_data: RiskAcceptanceCreate,
    requested_by_user_id: UUID
) -> RiskAcceptance:
    """Create a new risk acceptance request"""
    # Verify threat exists
    threat = db.query(Threat).filter(Threat.threat_id == acceptance_data.threat_id).first()
    if not threat:
        raise ValueError(f"Threat with ID {acceptance_data.threat_id} not found")
    
    # Calculate expiration date
    expiration_date = date.today() + timedelta(days=acceptance_data.acceptance_period_days)
    
    # Create risk acceptance
    risk_acceptance = RiskAcceptance(
        threat_id=acceptance_data.threat_id,
        requested_by=requested_by_user_id,
        justification=acceptance_data.justification,
        acceptance_period_days=acceptance_data.acceptance_period_days,
        expiration_date=expiration_date,
        status=RiskAcceptanceStatus.PENDING
    )
    
    db.add(risk_acceptance)
    db.commit()
    db.refresh(risk_acceptance)
    
    return risk_acceptance


def get_risk_acceptance(db: Session, acceptance_id: UUID) -> Optional[RiskAcceptance]:
    """Get risk acceptance by ID"""
    return db.query(RiskAcceptance).filter(RiskAcceptance.acceptance_id == acceptance_id).first()


def get_risk_acceptances(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    threat_id: Optional[UUID] = None,
    status: Optional[RiskAcceptanceStatus] = None,
    requested_by: Optional[UUID] = None
) -> Tuple[List[RiskAcceptance], int]:
    """Get paginated list of risk acceptances with optional filters"""
    query = db.query(RiskAcceptance)
    
    if threat_id:
        query = query.filter(RiskAcceptance.threat_id == threat_id)
    
    if status:
        query = query.filter(RiskAcceptance.status == status)
    
    if requested_by:
        query = query.filter(RiskAcceptance.requested_by == requested_by)
    
    total = query.count()
    acceptances = query.order_by(RiskAcceptance.created_at.desc()).offset(skip).limit(limit).all()
    
    return acceptances, total


def update_risk_acceptance(
    db: Session,
    acceptance_id: UUID,
    acceptance_data: RiskAcceptanceUpdate
) -> Optional[RiskAcceptance]:
    """Update risk acceptance"""
    risk_acceptance = get_risk_acceptance(db, acceptance_id)
    if not risk_acceptance:
        return None
    
    if acceptance_data.justification is not None:
        risk_acceptance.justification = acceptance_data.justification
    
    if acceptance_data.acceptance_period_days is not None:
        risk_acceptance.acceptance_period_days = acceptance_data.acceptance_period_days
        # Recalculate expiration date
        risk_acceptance.expiration_date = date.today() + timedelta(days=acceptance_data.acceptance_period_days)
    
    if acceptance_data.status is not None:
        risk_acceptance.status = acceptance_data.status
    
    db.commit()
    db.refresh(risk_acceptance)
    
    return risk_acceptance


def approve_risk_acceptance(
    db: Session,
    acceptance_id: UUID,
    approved_by_user_id: UUID,
    approval_signature_name: Optional[str] = None
) -> Optional[RiskAcceptance]:
    """Approve a risk acceptance request"""
    risk_acceptance = get_risk_acceptance(db, acceptance_id)
    if not risk_acceptance:
        return None
    
    if risk_acceptance.status != RiskAcceptanceStatus.PENDING:
        raise ValueError(f"Risk acceptance {acceptance_id} is not in PENDING status")
    
    risk_acceptance.status = RiskAcceptanceStatus.APPROVED
    risk_acceptance.approved_by = approved_by_user_id
    risk_acceptance.approval_signature_name = approval_signature_name
    risk_acceptance.approval_signature_timestamp = datetime.utcnow()
    
    db.commit()
    db.refresh(risk_acceptance)
    
    return risk_acceptance


def reject_risk_acceptance(
    db: Session,
    acceptance_id: UUID,
    rejected_by_user_id: UUID
) -> Optional[RiskAcceptance]:
    """Reject a risk acceptance request"""
    risk_acceptance = get_risk_acceptance(db, acceptance_id)
    if not risk_acceptance:
        return None
    
    if risk_acceptance.status != RiskAcceptanceStatus.PENDING:
        raise ValueError(f"Risk acceptance {acceptance_id} is not in PENDING status")
    
    risk_acceptance.status = RiskAcceptanceStatus.REJECTED
    risk_acceptance.approved_by = rejected_by_user_id
    risk_acceptance.approval_signature_timestamp = datetime.utcnow()
    
    db.commit()
    db.refresh(risk_acceptance)
    
    return risk_acceptance


def delete_risk_acceptance(db: Session, acceptance_id: UUID) -> bool:
    """Delete a risk acceptance"""
    risk_acceptance = get_risk_acceptance(db, acceptance_id)
    if not risk_acceptance:
        return False
    
    db.delete(risk_acceptance)
    db.commit()
    
    return True


def check_expired_acceptances(db: Session) -> List[RiskAcceptance]:
    """Check and update expired risk acceptances"""
    today = date.today()
    expired = db.query(RiskAcceptance).filter(
        RiskAcceptance.status == RiskAcceptanceStatus.APPROVED,
        RiskAcceptance.expiration_date < today
    ).all()
    
    for acceptance in expired:
        acceptance.status = RiskAcceptanceStatus.EXPIRED
    
    db.commit()
    
    return expired

