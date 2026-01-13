"""Authentication service for user management"""

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole


class AuthService:
    """Service for authentication operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User | None:
        """Get user by email address"""
        return self.db.query(User).filter(User.email == email.lower()).first()

    def get_user_by_id(self, user_id: str) -> User | None:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(
        self,
        email: str,
        password: str,
        first_name: str | None = None,
        last_name: str | None = None,
        role: UserRole = UserRole.VIEWER,
    ) -> User:
        """Create a new user"""
        user = User(
            email=email.lower(),
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            role=role.value,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate_user(self, email: str, password: str) -> User | None:
        """Authenticate user by email and password"""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        if not user.is_active:
            return None

        # Update last login
        user.last_login = datetime.now(UTC)
        self.db.commit()

        return user

    def create_tokens(self, user: User) -> dict[str, str]:
        """Create access and refresh tokens for user"""
        token_data = {"sub": str(user.id), "email": user.email, "role": user.role}
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "token_type": "bearer",
        }

    def refresh_access_token(self, refresh_token: str) -> dict[str, str] | None:
        """Create new access token from refresh token"""
        payload = decode_token(refresh_token)
        if payload is None:
            return None

        # Verify it's a refresh token
        if payload.get("type") != "refresh":
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        user = self.get_user_by_id(user_id)
        if not user or not user.is_active:
            return None

        # Create new tokens
        return self.create_tokens(user)

    def update_password(self, user: User, new_password: str) -> None:
        """Update user password"""
        user.password_hash = hash_password(new_password)
        self.db.commit()
