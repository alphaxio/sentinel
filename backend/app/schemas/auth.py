"""
Authentication Schemas
"""
from pydantic import BaseModel, field_validator
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import re


class LoginRequest(BaseModel):
    email: str
    password: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        # More lenient email validation for development (allows .local, .test, etc.)
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    user_id: UUID
    email: str
    full_name: str
    role: str
    permissions: List[str]

    model_config = {"from_attributes": True}


class OAuth2AuthorizationRequest(BaseModel):
    """OAuth2 authorization request"""
    redirect_uri: str = "http://localhost:8080/auth/callback"


class OAuth2CallbackRequest(BaseModel):
    """OAuth2 callback with authorization code"""
    code: str
    state: Optional[str] = None


class OAuth2ConfigResponse(BaseModel):
    """OAuth2 configuration for frontend"""
    enabled: bool
    authorization_url: Optional[str] = None
    client_id: Optional[str] = None
    redirect_uri: Optional[str] = None
    scope: Optional[str] = None
