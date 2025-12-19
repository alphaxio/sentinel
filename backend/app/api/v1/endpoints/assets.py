"""
Assets API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse, PaginatedResponse
from app.services.asset_service import (
    create_asset,
    get_asset,
    get_assets,
    update_asset,
    delete_asset
)

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
