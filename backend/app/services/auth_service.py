"""
Authentication Service
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from jose import jwt
import bcrypt
import httpx
from authlib.integrations.httpx_client import AsyncOAuth2Client
from app.core.config import settings
from app.models.user import User, Role
from app.schemas.auth import Token, UserResponse


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Generate salt and hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(user_id: str, email: str, role_name: str, permissions: list) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role_name,
        "permissions": permissions,
        "exp": expire
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return token


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate user by email and password"""
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        return None
    
    # Check if user has password set
    if not user.password_hash:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user


def get_user_response(user: User) -> UserResponse:
    """Convert User model to UserResponse schema"""
    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.role_name if user.role else "",
        permissions=user.role.permissions if user.role else []
    )


async def get_oauth2_authorization_url(state: Optional[str] = None) -> str:
    """Generate OAuth2 authorization URL"""
    if not settings.OAUTH2_ENABLED or not settings.OAUTH2_CLIENT_ID:
        raise ValueError("OAuth2 is not configured")
    
    async with AsyncOAuth2Client(
        client_id=settings.OAUTH2_CLIENT_ID,
        client_secret=settings.OAUTH2_CLIENT_SECRET,
        redirect_uri=settings.OAUTH2_REDIRECT_URI,
    ) as client:
        authorization_url, _ = await client.create_authorization_url(
            settings.OAUTH2_AUTHORIZATION_URL,
            state=state,
            scope=settings.OAUTH2_SCOPE
        )
        return authorization_url


async def exchange_oauth2_code_for_token(code: str) -> Dict[str, Any]:
    """Exchange authorization code for access token"""
    if not settings.OAUTH2_ENABLED:
        raise ValueError("OAuth2 is not configured")
    
    async with AsyncOAuth2Client(
        client_id=settings.OAUTH2_CLIENT_ID,
        client_secret=settings.OAUTH2_CLIENT_SECRET,
        redirect_uri=settings.OAUTH2_REDIRECT_URI,
    ) as client:
        token_response = await client.fetch_token(
            settings.OAUTH2_TOKEN_URL,
            code=code
        )
        return token_response


async def get_oauth2_user_info(access_token: str) -> Dict[str, Any]:
    """Get user information from OAuth2 provider"""
    if not settings.OAUTH2_USERINFO_URL:
        # If no userinfo endpoint, try to decode JWT token if provider uses JWT
        try:
            # Some providers return user info in the ID token
            return {}
        except:
            return {}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            settings.OAUTH2_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        response.raise_for_status()
        return response.json()


def get_or_create_oauth2_user(
    db: Session,
    email: str,
    full_name: str,
    oauth2_sub: Optional[str] = None
) -> User:
    """Get existing user or create new user from OAuth2 info"""
    # Try to find user by oauth2_sub first (most reliable for OAuth2)
    if oauth2_sub:
        user = db.query(User).filter(User.oauth2_sub == oauth2_sub).first()
        if user:
            # Update user info if needed
            if not user.full_name or user.full_name != full_name:
                user.full_name = full_name
            if user.email != email:
                user.email = email
            db.commit()
            db.refresh(user)
            return user
    
    # Try to find user by email
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        # Update user info if needed
        if not user.full_name or user.full_name != full_name:
            user.full_name = full_name
        # Link OAuth2 account if not already linked
        if oauth2_sub and not user.oauth2_sub:
            user.oauth2_sub = oauth2_sub
        db.commit()
        db.refresh(user)
        return user
    
    # Create new user - assign default role (Developer)
    default_role = db.query(Role).filter(Role.role_name == "Developer").first()
    if not default_role:
        # Fallback to first available role
        default_role = db.query(Role).first()
        if not default_role:
            raise ValueError("No roles found in database")
    
    new_user = User(
        email=email,
        full_name=full_name,
        role_id=default_role.role_id,
        password_hash=None,  # OAuth2 users don't have passwords
        oauth2_sub=oauth2_sub
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

