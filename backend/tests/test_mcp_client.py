"""Tests for MCP client and platform manager"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.services.mcp_client import MCPClient
from app.services.platform_manager import PlatformManager


class TestMCPClient:
    """Tests for MCPClient"""

    @pytest.fixture
    def mcp_client(self):
        """Create MCP client for testing"""
        return MCPClient(server_url="http://localhost:3001", server_name="test-mcp")

    @pytest.mark.asyncio
    async def test_call_tool_success(self, mcp_client):
        """Test successful tool call"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "id": 1,
            "result": {"campaigns": [{"campaign_id": "123", "name": "Test Campaign"}]},
        }
        mock_response.raise_for_status = MagicMock()

        with patch.object(mcp_client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            result = await mcp_client.call_tool(
                tool_name="get_campaign_performance",
                arguments={"date_range": {"start_date": "2026-01-01", "end_date": "2026-01-07"}},
            )

            assert "campaigns" in result
            assert len(result["campaigns"]) == 1
            mock_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_call_tool_error_response(self, mcp_client):
        """Test tool call with error response"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "id": 1,
            "error": {"code": -32000, "message": "Campaign not found"},
        }
        mock_response.raise_for_status = MagicMock()

        with patch.object(mcp_client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            with pytest.raises(Exception) as exc_info:
                await mcp_client.call_tool(
                    tool_name="pause_campaign", arguments={"campaign_id": "invalid"}
                )

            assert "MCP Error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_list_tools(self, mcp_client):
        """Test listing available tools"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "id": 1,
            "result": {
                "tools": [
                    {"name": "get_campaign_performance"},
                    {"name": "update_campaign_budget"},
                    {"name": "pause_campaign"},
                    {"name": "resume_campaign"},
                ]
            },
        }
        mock_response.raise_for_status = MagicMock()

        with patch.object(mcp_client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            tools = await mcp_client.list_tools()

            assert len(tools) == 4
            assert tools[0]["name"] == "get_campaign_performance"

    @pytest.mark.asyncio
    async def test_ping_success(self, mcp_client):
        """Test ping when server is available"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"jsonrpc": "2.0", "id": 1, "result": {"tools": []}}
        mock_response.raise_for_status = MagicMock()

        with patch.object(mcp_client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            result = await mcp_client.ping()

            assert result is True

    @pytest.mark.asyncio
    async def test_ping_failure(self, mcp_client):
        """Test ping when server is unavailable"""
        with patch.object(mcp_client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = Exception("Connection refused")

            result = await mcp_client.ping()

            assert result is False


class TestPlatformManager:
    """Tests for PlatformManager"""

    @pytest.fixture
    def platform_manager(self):
        """Create platform manager for testing"""
        return PlatformManager()

    def test_initialization(self, platform_manager):
        """Test platform manager initializes all clients"""
        assert "google_ads" in platform_manager.clients
        assert "meta_ads" in platform_manager.clients
        assert "tiktok_ads" in platform_manager.clients
        assert "linkedin_ads" in platform_manager.clients

    def test_get_client_valid_platform(self, platform_manager):
        """Test getting client for valid platform"""
        client = platform_manager._get_client("google_ads")
        assert client is not None
        assert client.server_name == "google-ads-mcp"

    def test_get_client_invalid_platform(self, platform_manager):
        """Test getting client for invalid platform"""
        with pytest.raises(ValueError) as exc_info:
            platform_manager._get_client("invalid_platform")

        assert "Unknown platform" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_campaign_performance(self, platform_manager):
        """Test getting campaign performance"""
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
                    "roas": 10.0,
                }
            ],
            "count": 1,
        }

        with patch.object(
            platform_manager.clients["google_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = mock_result

            result = await platform_manager.get_campaign_performance(
                platform="google_ads", start_date="2026-01-01", end_date="2026-01-07"
            )

            assert result["count"] == 1
            assert len(result["campaigns"]) == 1
            mock_call.assert_called_once_with(
                "get_campaign_performance",
                {"date_range": {"start_date": "2026-01-01", "end_date": "2026-01-07"}},
            )

    @pytest.mark.asyncio
    async def test_update_campaign_budget_google_ads(self, platform_manager):
        """Test updating budget for Google Ads (uses micros)"""
        mock_result = {
            "success": True,
            "campaign_id": "123",
            "old_budget_usd": 100,
            "new_budget_usd": 150,
        }

        with patch.object(
            platform_manager.clients["google_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = mock_result

            result = await platform_manager.update_campaign_budget(
                platform="google_ads", campaign_id="123", new_budget=150.0
            )

            assert result["success"] is True
            # Check that budget was converted to micros for Google Ads
            call_args = mock_call.call_args[0][1]
            assert call_args["new_budget_micros"] == 150_000_000

    @pytest.mark.asyncio
    async def test_update_campaign_budget_meta_ads(self, platform_manager):
        """Test updating budget for Meta Ads (uses USD)"""
        mock_result = {"success": True}

        with patch.object(
            platform_manager.clients["meta_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = mock_result

            result = await platform_manager.update_campaign_budget(
                platform="meta_ads", campaign_id="123", new_budget=150.0
            )

            assert result["success"] is True
            # Check that budget was NOT converted to micros
            call_args = mock_call.call_args[0][1]
            assert call_args["new_budget"] == 150.0

    @pytest.mark.asyncio
    async def test_pause_campaign(self, platform_manager):
        """Test pausing a campaign"""
        mock_result = {"success": True, "campaign_id": "123", "action": "paused"}

        with patch.object(
            platform_manager.clients["google_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = mock_result

            result = await platform_manager.pause_campaign(platform="google_ads", campaign_id="123")

            assert result["success"] is True
            assert result["action"] == "paused"

    @pytest.mark.asyncio
    async def test_resume_campaign(self, platform_manager):
        """Test resuming a campaign"""
        mock_result = {"success": True, "campaign_id": "123", "action": "resumed"}

        with patch.object(
            platform_manager.clients["google_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = mock_result

            result = await platform_manager.resume_campaign(
                platform="google_ads", campaign_id="123"
            )

            assert result["success"] is True
            assert result["action"] == "resumed"

    @pytest.mark.asyncio
    async def test_health_check(self, platform_manager):
        """Test health check for all platforms"""
        # Mock ping for all clients
        for client in platform_manager.clients.values():
            client.ping = AsyncMock(return_value=True)

        health = await platform_manager.health_check()

        assert health["google_ads"] is True
        assert health["meta_ads"] is True
        assert health["tiktok_ads"] is True
        assert health["linkedin_ads"] is True

    @pytest.mark.asyncio
    async def test_get_all_campaigns(self, platform_manager):
        """Test fetching campaigns from all platforms"""
        mock_result = {"campaigns": [{"campaign_id": "123"}], "count": 1}

        # Mock all clients
        for client in platform_manager.clients.values():
            client.call_tool = AsyncMock(return_value=mock_result)

        results = await platform_manager.get_all_campaigns(
            start_date="2026-01-01", end_date="2026-01-07"
        )

        assert "google_ads" in results
        assert "meta_ads" in results
        assert "tiktok_ads" in results
        assert "linkedin_ads" in results
