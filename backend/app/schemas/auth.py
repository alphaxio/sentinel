"""
Authentication Schemas
"""
from pydantic import BaseModel, EmailStr
from typing import List
from uuid import UUID
from datetime import datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


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
