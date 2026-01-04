"""
Finding Service - Business Logic
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.models.finding import Finding, FindingStatus, FindingSeverity
from app.schemas.finding import FindingCreate, FindingUpdate


def create_finding(db: Session, finding_data: FindingCreate) -> Finding:
    """Create a new finding"""
    finding = Finding(
        asset_id=finding_data.asset_id,
        vulnerability_type=finding_data.vulnerability_type,
        severity=finding_data.severity,
        location=finding_data.location,
        cve_id=finding_data.cve_id,
        scan_result_id=finding_data.scan_result_id,
        threat_id=finding_data.threat_id,
        scanner_sources=finding_data.scanner_sources,
        status=FindingStatus.OPEN
    )
    
    db.add(finding)
    db.commit()
    db.refresh(finding)
    return finding


def get_finding(db: Session, finding_id: UUID) -> Optional[Finding]:
    """Get finding by ID"""
    return db.query(Finding).filter(Finding.finding_id == finding_id).first()


def get_findings(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    severity: Optional[FindingSeverity] = None,
    status: Optional[FindingStatus] = None,
    asset_id: Optional[UUID] = None,
    threat_id: Optional[UUID] = None
) -> tuple[List[Finding], int]:
    """Get paginated list of findings"""
    query = db.query(Finding)
    
    if search:
        query = query.filter(
            Finding.vulnerability_type.ilike(f"%{search}%") |
            Finding.cve_id.ilike(f"%{search}%") |
            Finding.location.ilike(f"%{search}%")
        )
    
    if severity:
        query = query.filter(Finding.severity == severity)
    
    if status:
        query = query.filter(Finding.status == status)
    
    if asset_id:
        query = query.filter(Finding.asset_id == asset_id)
    
    if threat_id:
        query = query.filter(Finding.threat_id == threat_id)
    
    total = query.count()
    findings = query.order_by(
        Finding.severity.desc(),
        Finding.first_detected.desc()
    ).offset(skip).limit(limit).all()
    
    return findings, total


def update_finding(
    db: Session,
    finding_id: UUID,
    finding_data: FindingUpdate
) -> Optional[Finding]:
    """Update a finding"""
    finding = get_finding(db, finding_id)
    if not finding:
        return None
    
    update_data = finding_data.dict(exclude_unset=True)
    
    # If status is being changed to REMEDIATED, set remediated_at
    if 'status' in update_data and update_data['status'] == FindingStatus.REMEDIATED:
        from datetime import datetime, timezone
        update_data['remediated_at'] = datetime.now(timezone.utc)
    elif 'status' in update_data and update_data['status'] != FindingStatus.REMEDIATED:
        update_data['remediated_at'] = None
    
    for key, value in update_data.items():
        setattr(finding, key, value)
    
    db.commit()
    db.refresh(finding)
    return finding


def delete_finding(db: Session, finding_id: UUID) -> bool:
    """Delete a finding"""
    finding = get_finding(db, finding_id)
    if not finding:
        return False
    
    db.delete(finding)
    db.commit()
    return True


def get_findings_by_asset(db: Session, asset_id: UUID) -> List[Finding]:
    """Get all findings for a specific asset"""
    return db.query(Finding).filter(
        Finding.asset_id == asset_id
    ).order_by(Finding.severity.desc(), Finding.first_detected.desc()).all()


def get_findings_by_threat(db: Session, threat_id: UUID) -> List[Finding]:
    """Get all findings for a specific threat"""
    return db.query(Finding).filter(
        Finding.threat_id == threat_id
    ).order_by(Finding.severity.desc(), Finding.first_detected.desc()).all()

