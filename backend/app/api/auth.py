"""Authentication API endpoints"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.database import get_db
from app.models.user import UserRole
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


# Request/Response schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str | None = None
    last_name: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str | None
    last_name: str | None
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Annotated[Session, Depends(get_db)],
):
    """Register a new user"""
    auth_service = AuthService(db)

    # Check if user already exists
    if auth_service.get_user_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user with default VIEWER role
    user = auth_service.create_user(
        email=user_data.email,
        password=user_data.password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=UserRole.VIEWER,
    )

    return UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    """Login and get access token"""
    auth_service = AuthService(db)

    user = auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tokens = auth_service.create_tokens(user)
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Refresh access token using refresh token"""
    auth_service = AuthService(db)

    tokens = auth_service.refresh_access_token(request.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(**tokens)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: CurrentUser):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        is_active=current_user.is_active,
    )
