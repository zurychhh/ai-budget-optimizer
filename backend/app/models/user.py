"""User model with role-based access control"""

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class UserRole(str, Enum):
    """User roles for RBAC"""

    ADMIN = "admin"  # Full access + user management
    MANAGER = "manager"  # Modify budgets, accept recommendations
    ANALYST = "analyst"  # View data, analyze, reject recommendations
    VIEWER = "viewer"  # Read-only dashboard access


# Role hierarchy for permission checks
ROLE_HIERARCHY = {
    UserRole.ADMIN: 4,
    UserRole.MANAGER: 3,
    UserRole.ANALYST: 2,
    UserRole.VIEWER: 1,
}


def has_role_permission(user_role: UserRole, required_role: UserRole) -> bool:
    """Check if user_role has at least the permissions of required_role"""
    return ROLE_HIERARCHY.get(user_role, 0) >= ROLE_HIERARCHY.get(required_role, 0)


class User(Base):
    """User model for authentication and authorization"""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    role = Column(String(50), default=UserRole.VIEWER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)

    @property
    def full_name(self) -> str:
        """Return full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.email

    @property
    def user_role(self) -> UserRole:
        """Return role as enum"""
        return UserRole(self.role)

    def has_permission(self, required_role: UserRole) -> bool:
        """Check if user has at least the required role level"""
        return has_role_permission(self.user_role, required_role)

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
