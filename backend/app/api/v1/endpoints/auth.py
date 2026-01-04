"""
Authentication API Endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    Token,
    UserResponse,
    OAuth2AuthorizationRequest,
    OAuth2CallbackRequest,
    OAuth2ConfigResponse
)
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_user_response,
    get_oauth2_authorization_url,
    exchange_oauth2_code_for_token,
    get_oauth2_user_info,
    get_or_create_oauth2_user
)

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login endpoint - authenticate user and return JWT token
    """
    user = authenticate_user(db, login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user permissions
    permissions = user.role.permissions if user.role else []
    role_name = user.role.role_name if user.role else ""
    
    # Create access token
    access_token = create_access_token(
        user_id=str(user.user_id),
        email=user.email,
        role_name=role_name,
        permissions=permissions
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information
    """
    return get_user_response(current_user)


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout endpoint - invalidate token (client-side token removal)
    Note: For stateless JWT, actual invalidation requires token blacklist
    """
    return {"message": "Successfully logged out"}


@router.get("/oauth2/config", response_model=OAuth2ConfigResponse)
async def get_oauth2_config():
    """
    Get OAuth2 configuration for frontend
    """
    return OAuth2ConfigResponse(
        enabled=settings.OAUTH2_ENABLED and bool(settings.OAUTH2_CLIENT_ID),
        authorization_url=settings.OAUTH2_AUTHORIZATION_URL if settings.OAUTH2_ENABLED else None,
        client_id=settings.OAUTH2_CLIENT_ID if settings.OAUTH2_ENABLED else None,
        redirect_uri=settings.OAUTH2_REDIRECT_URI if settings.OAUTH2_ENABLED else None,
        scope=settings.OAUTH2_SCOPE if settings.OAUTH2_ENABLED else None
    )


@router.get("/oauth2/authorize")
async def oauth2_authorize(
    state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Initiate OAuth2 authorization flow
    Redirects user to OAuth2 provider
    """
    if not settings.OAUTH2_ENABLED or not settings.OAUTH2_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OAuth2 is not configured"
        )
    
    try:
        authorization_url = await get_oauth2_authorization_url(state=state)
        return RedirectResponse(url=authorization_url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate OAuth2 flow: {str(e)}"
        )


@router.post("/oauth2/callback", response_model=Token)
async def oauth2_callback(
    callback_data: OAuth2CallbackRequest,
    db: Session = Depends(get_db)
):
    """
    OAuth2 callback endpoint - exchange code for token
    """
    if not settings.OAUTH2_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OAuth2 is not configured"
        )
    
    try:
        # Exchange authorization code for access token
        token_response = await exchange_oauth2_code_for_token(callback_data.code)
        access_token = token_response.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to obtain access token from OAuth2 provider"
            )
        
        # Get user information from OAuth2 provider
        user_info = await get_oauth2_user_info(access_token)
        
        # Extract user details (provider-specific)
        email = user_info.get("email") or user_info.get("preferred_username")
        full_name = user_info.get("name") or user_info.get("full_name") or email.split("@")[0]
        oauth2_sub = user_info.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to retrieve user email from OAuth2 provider"
            )
        
        # Get or create user
        user = get_or_create_oauth2_user(
            db=db,
            email=email,
            full_name=full_name,
            oauth2_sub=oauth2_sub
        )
        
        # Get user permissions
        permissions = user.role.permissions if user.role else []
        role_name = user.role.role_name if user.role else ""
        
        # Create our JWT token
        jwt_token = create_access_token(
            user_id=str(user.user_id),
            email=user.email,
            role_name=role_name,
            permissions=permissions
        )
        
        return Token(access_token=jwt_token, token_type="bearer")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth2 callback failed: {str(e)}"
        )


