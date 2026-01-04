"""
Assets API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import csv
import json

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse, BulkImportResponse
from app.schemas.common import PaginatedResponse
from app.services.asset_service import (
    create_asset,
    get_asset,
    get_assets,
    update_asset,
    delete_asset,
    get_asset_relationships,
    create_asset_relationship,
    delete_asset_relationship,
    bulk_import_assets
)
from app.schemas.asset import AssetRelationshipCreate, AssetRelationshipResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[AssetResponse])
async def list_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List assets with pagination"""
    skip = (page - 1) * page_size
    assets, total = get_assets(db, skip=skip, limit=page_size, search=search)
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=[AssetResponse.model_validate(asset) for asset in assets],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset_by_id(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get asset by ID"""
    asset = get_asset(db, str(asset_id))
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse.model_validate(asset)


@router.post("", response_model=AssetResponse, status_code=201)
async def create_new_asset(
    asset_data: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("assets:write"))
):
    """Create a new asset"""
    asset = create_asset(db, asset_data)
    return AssetResponse.model_validate(asset)


@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_existing_asset(
    asset_id: UUID,
    asset_data: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("assets:write"))
):
    """Update an asset"""
    asset = update_asset(db, str(asset_id), asset_data)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse.model_validate(asset)


@router.delete("/{asset_id}", status_code=204)
async def delete_existing_asset(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("assets:write"))
):
    """Delete (archive) an asset"""
    success = delete_asset(db, str(asset_id))
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")
    return None


@router.get("/{asset_id}/relationships", response_model=List[AssetRelationshipResponse])
async def get_asset_relationships_endpoint(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all relationships for an asset"""
    from sqlalchemy.orm import joinedload
    from app.models.asset import AssetRelationship, Asset
    
    # Eagerly load source and target assets
    relationships = db.query(AssetRelationship).options(
        joinedload(AssetRelationship.source_asset),
        joinedload(AssetRelationship.target_asset)
    ).filter(
        (AssetRelationship.source_asset_id == asset_id) |
        (AssetRelationship.target_asset_id == asset_id)
    ).all()
    
    # Build response with asset details
    result = []
    for rel in relationships:
        rel_dict = {
            "relationship_id": rel.relationship_id,
            "source_asset_id": str(rel.source_asset_id),
            "target_asset_id": str(rel.target_asset_id),
            "relationship_type": rel.relationship_type.value,
            "source_asset": {
                "asset_id": str(rel.source_asset.asset_id),
                "name": rel.source_asset.name,
                "type": rel.source_asset.type.value
            } if rel.source_asset else None,
            "target_asset": {
                "asset_id": str(rel.target_asset.asset_id),
                "name": rel.target_asset.name,
                "type": rel.target_asset.type.value
            } if rel.target_asset else None,
        }
        result.append(AssetRelationshipResponse(**rel_dict))
    
    return result


@router.post("/{asset_id}/relationships", response_model=AssetRelationshipResponse, status_code=201)
async def create_asset_relationship_endpoint(
    asset_id: UUID,
    relationship_data: AssetRelationshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("assets:write"))
):
    """Create a relationship between assets"""
    try:
        relationship = create_asset_relationship(
            db,
            asset_id,
            relationship_data.target_asset_id,
            relationship_data.relationship_type
        )
        return AssetRelationshipResponse.model_validate(relationship)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/relationships/{relationship_id}", status_code=204)
async def delete_asset_relationship_endpoint(
    relationship_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("assets:write"))
):
    """Delete an asset relationship"""
    success = delete_asset_relationship(db, relationship_id)
    if not success:
        raise HTTPException(status_code=404, detail="Relationship not found")
    return None


@router.post("/bulk-import", response_model=BulkImportResponse)
async def bulk_import_assets_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("assets:write"))
):
    """
    Bulk import assets from CSV or JSON file
    """
    try:
        # Read file content
        content = await file.read()
        file_extension = file.filename.split('.')[-1].lower()
        
        assets_data = []
        
        if file_extension == 'csv':
            # Parse CSV
            content_str = content.decode('utf-8')
            csv_reader = csv.DictReader(content_str.splitlines())
            assets_data = list(csv_reader)
            
        elif file_extension == 'json':
            # Parse JSON
            content_str = content.decode('utf-8')
            assets_data = json.loads(content_str)
            if not isinstance(assets_data, list):
                raise HTTPException(status_code=400, detail="JSON must be an array of assets")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use CSV or JSON")
        
        if not assets_data:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Import assets
        created, updated, errors = bulk_import_assets(
            db=db,
            assets_data=assets_data,
            owner_id=current_user.user_id
        )
        
        return BulkImportResponse(
            total=len(assets_data),
            created=created,
            updated=updated,
            errors=errors
        )
        
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
