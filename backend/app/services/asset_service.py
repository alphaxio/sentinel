"""
Asset Service - Business Logic
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.models.asset import Asset, AssetRelationship
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


def get_asset_relationships(db: Session, asset_id: UUID) -> List[AssetRelationship]:
    """Get all relationships for an asset"""
    return db.query(AssetRelationship).filter(
        (AssetRelationship.source_asset_id == asset_id) |
        (AssetRelationship.target_asset_id == asset_id)
    ).all()


def create_asset_relationship(
    db: Session,
    source_asset_id: UUID,
    target_asset_id: UUID,
    relationship_type: str
) -> AssetRelationship:
    """Create a relationship between two assets"""
    # Prevent self-relationships
    if source_asset_id == target_asset_id:
        raise ValueError("Asset cannot have a relationship with itself")
    
    # Check if relationship already exists
    existing = db.query(AssetRelationship).filter(
        AssetRelationship.source_asset_id == source_asset_id,
        AssetRelationship.target_asset_id == target_asset_id,
        AssetRelationship.relationship_type == relationship_type
    ).first()
    
    if existing:
        raise ValueError("Relationship already exists")
    
    relationship = AssetRelationship(
        source_asset_id=source_asset_id,
        target_asset_id=target_asset_id,
        relationship_type=relationship_type
    )
    
    db.add(relationship)
    db.commit()
    db.refresh(relationship)
    return relationship


def delete_asset_relationship(db: Session, relationship_id: UUID) -> bool:
    """Delete an asset relationship"""
    relationship = db.query(AssetRelationship).filter(
        AssetRelationship.relationship_id == relationship_id
    ).first()
    
    if not relationship:
        return False
    
    db.delete(relationship)
    db.commit()
    return True


def bulk_import_assets(
    db: Session,
    assets_data: List[dict],
    owner_id: UUID
) -> tuple[int, int, List[str]]:
    """
    Bulk import assets from list of dictionaries
    Returns: (created_count, updated_count, errors_list)
    """
    created = 0
    updated = 0
    errors = []
    
    for idx, asset_dict in enumerate(assets_data):
        try:
            # Validate required fields
            if 'name' not in asset_dict:
                errors.append(f"Row {idx + 1}: Missing 'name' field")
                continue
            
            # Check if asset already exists
            existing_asset = db.query(Asset).filter(
                Asset.name == asset_dict['name']
            ).first()
            
            # Prepare asset data
            asset_data = {
                'name': asset_dict['name'],
                'type': asset_dict.get('type', 'Application'),
                'classification_level': asset_dict.get('classification_level', 'Internal'),
                'owner_id': owner_id,
                'confidentiality_score': int(asset_dict.get('confidentiality_score', 3)),
                'integrity_score': int(asset_dict.get('integrity_score', 3)),
                'availability_score': int(asset_dict.get('availability_score', 3)),
                'technology_stack': asset_dict.get('technology_stack', [])
            }
            
            # Calculate sensitivity
            sensitivity_score = calculate_sensitivity_score(
                asset_data['confidentiality_score'],
                asset_data['integrity_score'],
                asset_data['availability_score']
            )
            
            if existing_asset:
                # Update existing asset
                for key, value in asset_data.items():
                    setattr(existing_asset, key, value)
                existing_asset.sensitivity_score = sensitivity_score
                updated += 1
            else:
                # Create new asset
                new_asset = Asset(**asset_data, sensitivity_score=sensitivity_score)
                db.add(new_asset)
                created += 1
                
        except Exception as e:
            errors.append(f"Row {idx + 1}: {str(e)}")
    
    db.commit()
    return created, updated, errors
