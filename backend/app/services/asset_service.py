"""
Asset Service - Business Logic
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate
from decimal import Decimal


def calculate_sensitivity_score(
    confidentiality: int,
    integrity: int,
    availability: int
) -> Decimal:
    """Calculate sensitivity score: (C+I+A)/3"""
    return Decimal((confidentiality + integrity + availability) / 3.0)


def create_asset(db: Session, asset_data: AssetCreate) -> Asset:
    """Create a new asset with calculated sensitivity score"""
    sensitivity_score = calculate_sensitivity_score(
        asset_data.confidentiality_score,
        asset_data.integrity_score,
        asset_data.availability_score
    )
    
    asset = Asset(
        **asset_data.dict(),
        sensitivity_score=sensitivity_score
    )
    
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def get_asset(db: Session, asset_id: str) -> Optional[Asset]:
    """Get asset by ID"""
    return db.query(Asset).filter(Asset.asset_id == asset_id).first()


def get_assets(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None
) -> tuple[List[Asset], int]:
    """Get paginated list of assets"""
    query = db.query(Asset)
    
    if search:
        query = query.filter(Asset.name.ilike(f"%{search}%"))
    
    total = query.count()
    assets = query.offset(skip).limit(limit).all()
    
    return assets, total


def update_asset(
    db: Session,
    asset_id: str,
    asset_data: AssetUpdate
) -> Optional[Asset]:
    """Update an asset"""
    asset = get_asset(db, asset_id)
    if not asset:
        return None
    
    update_data = asset_data.dict(exclude_unset=True)
    
    # Recalculate sensitivity if CIA scores changed
    if any(key in update_data for key in ['confidentiality_score', 'integrity_score', 'availability_score']):
        confidentiality = update_data.get('confidentiality_score', asset.confidentiality_score)
        integrity = update_data.get('integrity_score', asset.integrity_score)
        availability = update_data.get('availability_score', asset.availability_score)
        update_data['sensitivity_score'] = calculate_sensitivity_score(
            confidentiality, integrity, availability
        )
    
    for key, value in update_data.items():
        setattr(asset, key, value)
    
    db.commit()
    db.refresh(asset)
    return asset


def delete_asset(db: Session, asset_id: str) -> bool:
    """Delete (archive) an asset"""
    asset = get_asset(db, asset_id)
    if not asset:
        return False
    
    db.delete(asset)
    db.commit()
    return True
