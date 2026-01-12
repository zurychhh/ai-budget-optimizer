"""Tests for campaigns API endpoints"""

from unittest.mock import AsyncMock

import pytest
from app.api.campaigns import get_platform_manager
from app.main import app
from fastapi.testclient import TestClient


class TestCampaignsAPI:
    """Tests for campaigns API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    @pytest.fixture
    def mock_platform_manager(self):
        """Create mock platform manager"""
        from app.services.platform_manager import PlatformManager

        mock_manager = PlatformManager()

        # Mock all client methods
        for client in mock_manager.clients.values():
            client.call_tool = AsyncMock()
            client.ping = AsyncMock(return_value=True)

        return mock_manager

    def test_get_platforms_health(self, client, mock_platform_manager):
        """Test health check endpoint"""
        app.dependency_overrides[get_platform_manager] = lambda: mock_platform_manager

        response = client.get("/api/platforms/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "platforms" in data

        app.dependency_overrides.clear()

    def test_get_campaign_performance_single_platform(self, client, mock_platform_manager):
        """Test getting campaign performance for single platform"""
        mock_result = {
            "campaigns": [
                {
                    "campaign_id": "123",
                    "campaign_name": "Test Campaign",
                    "status": "ENABLED",
                    "budget_usd": 100.0,
                    "impressions": 10000,
                    "clicks": 500,
                    "cost_usd": 50.0,
                    "conversions": 10,
                    "revenue_usd": 500.0,
                    "cpc": 0.10,
                    "ctr": 0.05,
                    "roas": 10.0,
                }
            ],
            "count": 1,
        }

        mock_platform_manager.clients["google_ads"].call_tool.return_value = mock_result
        app.dependency_overrides[get_platform_manager] = lambda: mock_platform_manager

        response = client.get(
            "/api/campaigns/performance",
            params={
                "platforms": ["google_ads"],
                "start_date": "2026-01-01",
                "end_date": "2026-01-07",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1
        assert len(data["campaigns"]) == 1
        assert data["campaigns"][0]["campaign_id"] == "123"
        assert data["platforms_queried"] == ["google_ads"]

        app.dependency_overrides.clear()

    def test_get_campaign_performance_all_platforms(self, client, mock_platform_manager):
        """Test getting campaign performance for all platforms"""
        mock_result = {
            "campaigns": [
                {
                    "campaign_id": "123",
                    "campaign_name": "Test",
                    "status": "ENABLED",
                    "budget_usd": 100,
                    "impressions": 1000,
                    "clicks": 50,
                    "cost_usd": 25,
                    "conversions": 5,
                    "revenue_usd": 250,
                    "cpc": 0.5,
                    "ctr": 0.05,
                    "roas": 10,
                }
            ],
            "count": 1,
        }

        for client_obj in mock_platform_manager.clients.values():
            client_obj.call_tool.return_value = mock_result

        app.dependency_overrides[get_platform_manager] = lambda: mock_platform_manager

        response = client.get(
            "/api/campaigns/performance",
            params={"start_date": "2026-01-01", "end_date": "2026-01-07"},
        )

        assert response.status_code == 200
        data = response.json()
        # Should have campaigns from all 4 platforms
        assert data["count"] == 4
        assert len(data["platforms_queried"]) == 4

        app.dependency_overrides.clear()

    def test_get_platform_specific_performance(self, client, mock_platform_manager):
        """Test getting performance for specific platform endpoint"""
        mock_result = {"campaigns": [{"campaign_id": "123"}], "count": 1, "platform": "google_ads"}

        mock_platform_manager.clients["google_ads"].call_tool.return_value = mock_result
        app.dependency_overrides[get_platform_manager] = lambda: mock_platform_manager

        response = client.get(
            "/api/campaigns/google_ads/performance",
            params={"start_date": "2026-01-01", "end_date": "2026-01-07"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["platform"] == "google_ads"

        app.dependency_overrides.clear()

    def test_get_platform_invalid_platform(self, client, mock_platform_manager):
        """Test invalid platform returns error"""
        app.dependency_overrides[get_platform_manager] = lambda: mock_platform_manager

        response = client.get(
            "/api/campaigns/invalid_platform/performance",
            params={"start_date": "2026-01-01", "end_date": "2026-01-07"},
        )

        assert response.status_code == 400
        assert "Invalid platform" in response.json()["detail"]

        app.dependency_overrides.clear()

    def test_update_campaign_budget(self, client, mock_platform_manager):
        """Test updating campaign budget"""
        mock_result = {
            "success": True,
            "campaign_id": "123",
            "old_budget_usd": 100.0,
            "new_budget_usd": 150.0,
        }

        mock_platform_manager.clients["google_ads"].call_tool.return_value = mock_result
        app.dependency_overrides[get_platform_manager] = lambda: mock_platform_manager

        response = client.put(
            "/api/campaigns/123/budget",
            params={"platform": "google_ads"},
            json={"new_budget": 150.0},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["new_budget_usd"] == 150.0

        app.dependency_overrides.clear()

    def test_update_campaign_budget_invalid(self, client, mock_platform_manager):
        """Test updating budget with invalid amount"""
        app.dependency_overrides[get_platform_manager] = lambda: mock_platform_manager

        response = client.put(
            "/api/campaigns/123/budget",
            params={"platform": "google_ads"},
            json={"new_budget": -50.0},
        )

        assert response.status_code == 400
        assert "positive" in response.json()["detail"].lower()

        app.dependency_overrides.clear()

    def test_pause_campaign(self, client, mock_platform_manager):
        """Test pausing a campaign"""
        mock_result = {"success": True, "campaign_id": "123", "action": "paused"}

        mock_platform_manager.clients["google_ads"].call_tool.return_value = mock_result
        app.dependency_overrides[get_platform_manager] = lambda: mock_platform_manager

        response = client.post("/api/campaigns/123/pause", params={"platform": "google_ads"})

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["action"] == "paused"

        app.dependency_overrides.clear()

    def test_resume_campaign(self, client, mock_platform_manager):
        """Test resuming a campaign"""
        mock_result = {"success": True, "campaign_id": "123", "action": "resumed"}

        mock_platform_manager.clients["google_ads"].call_tool.return_value = mock_result
        app.dependency_overrides[get_platform_manager] = lambda: mock_platform_manager

        response = client.post("/api/campaigns/123/resume", params={"platform": "google_ads"})

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["action"] == "resumed"

        app.dependency_overrides.clear()
