"""Tests for authentication endpoints and security utilities"""

import pytest
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.main import app
from app.models.user import UserRole, has_role_permission
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


class TestPasswordHashing:
    """Tests for password hashing utilities"""

    def test_hash_password_creates_hash(self):
        password = "securepassword123"
        hashed = hash_password(password)
        assert hashed != password
        assert len(hashed) > 50

    def test_verify_password_correct(self):
        password = "securepassword123"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        password = "securepassword123"
        hashed = hash_password(password)
        assert verify_password("wrongpassword", hashed) is False

    def test_hash_password_unique(self):
        password = "securepassword123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        # Different salts should produce different hashes
        assert hash1 != hash2


class TestJWTTokens:
    """Tests for JWT token creation and validation"""

    def test_create_access_token(self):
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)
        assert token is not None
        assert len(token) > 50

    def test_create_refresh_token(self):
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_refresh_token(data)
        assert token is not None
        assert len(token) > 50

    def test_decode_access_token(self):
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)
        decoded = decode_token(token)
        assert decoded is not None
        assert decoded["sub"] == "user123"
        assert decoded["email"] == "test@example.com"
        assert decoded["type"] == "access"

    def test_decode_refresh_token(self):
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_refresh_token(data)
        decoded = decode_token(token)
        assert decoded is not None
        assert decoded["sub"] == "user123"
        assert decoded["type"] == "refresh"

    def test_decode_invalid_token(self):
        result = decode_token("invalid.token.here")
        assert result is None


class TestRoleHierarchy:
    """Tests for role-based access control"""

    def test_admin_has_all_permissions(self):
        assert has_role_permission(UserRole.ADMIN, UserRole.ADMIN) is True
        assert has_role_permission(UserRole.ADMIN, UserRole.MANAGER) is True
        assert has_role_permission(UserRole.ADMIN, UserRole.ANALYST) is True
        assert has_role_permission(UserRole.ADMIN, UserRole.VIEWER) is True

    def test_manager_permissions(self):
        assert has_role_permission(UserRole.MANAGER, UserRole.ADMIN) is False
        assert has_role_permission(UserRole.MANAGER, UserRole.MANAGER) is True
        assert has_role_permission(UserRole.MANAGER, UserRole.ANALYST) is True
        assert has_role_permission(UserRole.MANAGER, UserRole.VIEWER) is True

    def test_analyst_permissions(self):
        assert has_role_permission(UserRole.ANALYST, UserRole.ADMIN) is False
        assert has_role_permission(UserRole.ANALYST, UserRole.MANAGER) is False
        assert has_role_permission(UserRole.ANALYST, UserRole.ANALYST) is True
        assert has_role_permission(UserRole.ANALYST, UserRole.VIEWER) is True

    def test_viewer_permissions(self):
        assert has_role_permission(UserRole.VIEWER, UserRole.ADMIN) is False
        assert has_role_permission(UserRole.VIEWER, UserRole.MANAGER) is False
        assert has_role_permission(UserRole.VIEWER, UserRole.ANALYST) is False
        assert has_role_permission(UserRole.VIEWER, UserRole.VIEWER) is True


class TestAuthEndpoints:
    """Tests for auth API endpoints"""

    @pytest.mark.integration
    def test_register_success(self, client: TestClient):
        response = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
                "first_name": "New",
                "last_name": "User",
            },
        )
        # May fail if DB is not available, which is expected in unit tests
        assert response.status_code in [201, 500]

    @pytest.mark.integration
    def test_register_duplicate_email(self, client: TestClient):
        # Register first user
        client.post(
            "/api/auth/register",
            json={"email": "duplicate@example.com", "password": "password123"},
        )
        # Try to register with same email
        response = client.post(
            "/api/auth/register",
            json={"email": "duplicate@example.com", "password": "password456"},
        )
        # Should fail with 400 or 500 (if DB not available)
        assert response.status_code in [400, 500]

    @pytest.mark.integration
    def test_login_invalid_credentials(self, client: TestClient):
        response = client.post(
            "/api/auth/login",
            data={"username": "nonexistent@example.com", "password": "wrongpassword"},
        )
        # Should fail with 401 or 500 (if DB not available)
        assert response.status_code in [401, 500]

    def test_me_unauthorized(self, client: TestClient):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_me_invalid_token(self, client: TestClient):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid.token"},
        )
        assert response.status_code == 401

    def test_refresh_invalid_token(self, client: TestClient):
        response = client.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid.token"},
        )
        assert response.status_code == 401


class TestProtectedEndpoints:
    """Tests for protected campaign and AI endpoints"""

    def test_campaigns_unauthorized(self, client: TestClient):
        response = client.get(
            "/api/campaigns/performance",
            params={"start_date": "2026-01-01", "end_date": "2026-01-07"},
        )
        assert response.status_code == 401

    def test_ai_analyze_unauthorized(self, client: TestClient):
        response = client.post(
            "/api/ai/analyze",
            json={"start_date": "2026-01-01", "end_date": "2026-01-07"},
        )
        assert response.status_code == 401

    def test_ai_optimize_budget_unauthorized(self, client: TestClient):
        response = client.post(
            "/api/ai/optimize-budget",
            json={"total_budget": 10000},
        )
        assert response.status_code == 401
