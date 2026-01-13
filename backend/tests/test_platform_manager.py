"""Comprehensive tests for PlatformManager and MCPClient"""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.services.mcp_client import MCPClient
from app.services.platform_manager import MCPConfig, PlatformManager


class TestMCPConfig:
    """Tests for MCPConfig dataclass"""

    def test_default_values(self):
        config = MCPConfig()
        assert config.host == "localhost"
        assert config.google_ads_port == 3001
        assert config.meta_ads_port == 3002
        assert config.tiktok_ads_port == 3003
        assert config.linkedin_ads_port == 3004

    def test_custom_values(self):
        config = MCPConfig(
            host="192.168.1.100",
            google_ads_port=4001,
            meta_ads_port=4002,
            tiktok_ads_port=4003,
            linkedin_ads_port=4004,
        )
        assert config.host == "192.168.1.100"
        assert config.google_ads_port == 4001


class TestMCPClient:
    """Tests for MCPClient JSON-RPC client"""

    @pytest.fixture
    def client(self):
        return MCPClient(
            server_url="http://localhost:3001", server_name="google-ads-mcp"
        )

    @pytest.mark.asyncio
    async def test_call_tool_success(self, client):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "id": 1,
            "result": {"campaigns": [], "count": 0},
        }
        mock_response.raise_for_status = MagicMock()

        with patch.object(client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            result = await client.call_tool(
                "get_campaign_performance",
                {"date_range": {"start_date": "2024-01-01", "end_date": "2024-01-31"}},
            )

            assert result == {"campaigns": [], "count": 0}
            mock_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_call_tool_error_response(self, client):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "id": 1,
            "error": {"code": -32600, "message": "Invalid Request"},
        }
        mock_response.raise_for_status = MagicMock()

        with patch.object(client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            with pytest.raises(Exception) as exc_info:
                await client.call_tool("invalid_tool", {})

            assert "MCP Error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_call_tool_http_error(self, client):
        with patch.object(client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = httpx.HTTPError("Connection refused")

            with pytest.raises(Exception) as exc_info:
                await client.call_tool("get_campaign_performance", {})

            assert "HTTP error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_list_tools_success(self, client):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "id": 1,
            "result": {
                "tools": [
                    {"name": "get_campaign_performance"},
                    {"name": "update_campaign_budget"},
                ]
            },
        }
        mock_response.raise_for_status = MagicMock()

        with patch.object(client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            tools = await client.list_tools()

            assert len(tools) == 2
            assert tools[0]["name"] == "get_campaign_performance"

    @pytest.mark.asyncio
    async def test_ping_success(self, client):
        mock_response = MagicMock()
        mock_response.json.return_value = {"result": {"tools": []}}
        mock_response.raise_for_status = MagicMock()

        with patch.object(client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            result = await client.ping()
            assert result is True

    @pytest.mark.asyncio
    async def test_ping_failure(self, client):
        with patch.object(client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = Exception("Connection failed")

            result = await client.ping()
            assert result is False

    @pytest.mark.asyncio
    async def test_request_id_increments(self, client):
        assert client.request_id == 0

        mock_response = MagicMock()
        mock_response.json.return_value = {"result": {}}
        mock_response.raise_for_status = MagicMock()

        with patch.object(client.client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            await client.call_tool("test", {})
            assert client.request_id == 1

            await client.call_tool("test", {})
            assert client.request_id == 2

    @pytest.mark.asyncio
    async def test_close(self, client):
        with patch.object(client.client, "aclose", new_callable=AsyncMock) as mock_close:
            await client.close()
            mock_close.assert_called_once()


class TestPlatformManager:
    """Tests for PlatformManager unified interface"""

    @pytest.fixture
    def config(self):
        return MCPConfig(
            host="localhost",
            google_ads_port=3001,
            meta_ads_port=3002,
            tiktok_ads_port=3003,
            linkedin_ads_port=3004,
        )

    @pytest.fixture
    def manager(self, config):
        with patch("app.services.platform_manager.settings") as mock_settings:
            mock_settings.mcp_host = "localhost"
            mock_settings.mcp_google_ads_port = 3001
            mock_settings.mcp_meta_ads_port = 3002
            mock_settings.mcp_tiktok_ads_port = 3003
            mock_settings.mcp_linkedin_ads_port = 3004
            return PlatformManager(config)

    def test_init_creates_clients(self, manager):
        assert "google_ads" in manager.clients
        assert "meta_ads" in manager.clients
        assert "tiktok_ads" in manager.clients
        assert "linkedin_ads" in manager.clients

    def test_get_client_valid_platform(self, manager):
        client = manager._get_client("google_ads")
        assert client is not None
        assert client.server_name == "google-ads-mcp"

    def test_get_client_invalid_platform(self, manager):
        with pytest.raises(ValueError) as exc_info:
            manager._get_client("invalid_platform")

        assert "Unknown platform" in str(exc_info.value)
        assert "invalid_platform" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_campaign_performance(self, manager):
        mock_result = {
            "campaigns": [{"id": "123", "name": "Test Campaign"}],
            "count": 1,
        }

        with patch.object(
            manager.clients["google_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = mock_result

            result = await manager.get_campaign_performance(
                platform="google_ads",
                start_date="2024-01-01",
                end_date="2024-01-31",
            )

            assert result == mock_result
            mock_call.assert_called_once_with(
                "get_campaign_performance",
                {"date_range": {"start_date": "2024-01-01", "end_date": "2024-01-31"}},
            )

    @pytest.mark.asyncio
    async def test_get_campaign_performance_with_ids(self, manager):
        with patch.object(
            manager.clients["meta_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = {"campaigns": []}

            await manager.get_campaign_performance(
                platform="meta_ads",
                start_date="2024-01-01",
                end_date="2024-01-31",
                campaign_ids=["123", "456"],
            )

            call_args = mock_call.call_args[0][1]
            assert call_args["campaign_ids"] == ["123", "456"]

    @pytest.mark.asyncio
    async def test_update_campaign_budget_google_ads(self, manager):
        """Google Ads uses micros format"""
        with patch.object(
            manager.clients["google_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = {"success": True}

            await manager.update_campaign_budget(
                platform="google_ads",
                campaign_id="123",
                new_budget=50.00,
            )

            call_args = mock_call.call_args[0][1]
            assert call_args["new_budget_micros"] == 50_000_000
            assert "new_budget" not in call_args

    @pytest.mark.asyncio
    async def test_update_campaign_budget_meta_ads(self, manager):
        """Meta Ads uses standard currency"""
        with patch.object(
            manager.clients["meta_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = {"success": True}

            await manager.update_campaign_budget(
                platform="meta_ads",
                campaign_id="456",
                new_budget=100.00,
            )

            call_args = mock_call.call_args[0][1]
            assert call_args["new_budget"] == 100.00
            assert "new_budget_micros" not in call_args

    @pytest.mark.asyncio
    async def test_pause_campaign(self, manager):
        with patch.object(
            manager.clients["google_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = {"success": True, "action": "paused"}

            result = await manager.pause_campaign(
                platform="google_ads",
                campaign_id="123",
            )

            assert result["success"] is True
            mock_call.assert_called_once_with(
                "pause_campaign", {"campaign_id": "123"}
            )

    @pytest.mark.asyncio
    async def test_resume_campaign(self, manager):
        with patch.object(
            manager.clients["tiktok_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = {"success": True, "action": "resumed"}

            result = await manager.resume_campaign(
                platform="tiktok_ads",
                campaign_id="789",
            )

            assert result["success"] is True
            mock_call.assert_called_once_with(
                "resume_campaign", {"campaign_id": "789"}
            )

    @pytest.mark.asyncio
    async def test_get_all_campaigns(self, manager):
        mock_results = {
            "google_ads": {"campaigns": [{"id": "g1"}]},
            "meta_ads": {"campaigns": [{"id": "m1"}]},
            "tiktok_ads": {"campaigns": []},
            "linkedin_ads": {"campaigns": []},
        }

        for platform, result in mock_results.items():
            manager.clients[platform].call_tool = AsyncMock(return_value=result)

        results = await manager.get_all_campaigns(
            start_date="2024-01-01",
            end_date="2024-01-31",
        )

        assert "google_ads" in results
        assert "meta_ads" in results
        assert results["google_ads"]["campaigns"][0]["id"] == "g1"

    @pytest.mark.asyncio
    async def test_get_all_campaigns_with_error(self, manager):
        manager.clients["google_ads"].call_tool = AsyncMock(
            return_value={"campaigns": []}
        )
        manager.clients["meta_ads"].call_tool = AsyncMock(
            side_effect=Exception("Connection failed")
        )
        manager.clients["tiktok_ads"].call_tool = AsyncMock(
            return_value={"campaigns": []}
        )
        manager.clients["linkedin_ads"].call_tool = AsyncMock(
            return_value={"campaigns": []}
        )

        results = await manager.get_all_campaigns(
            start_date="2024-01-01",
            end_date="2024-01-31",
        )

        assert "error" in results["meta_ads"]
        assert "Connection failed" in results["meta_ads"]["error"]
        assert "campaigns" in results["google_ads"]

    @pytest.mark.asyncio
    async def test_health_check_all_healthy(self, manager):
        for client in manager.clients.values():
            client.ping = AsyncMock(return_value=True)

        health = await manager.health_check()

        assert all(status is True for status in health.values())

    @pytest.mark.asyncio
    async def test_health_check_partial_failure(self, manager):
        manager.clients["google_ads"].ping = AsyncMock(return_value=True)
        manager.clients["meta_ads"].ping = AsyncMock(side_effect=Exception("Down"))
        manager.clients["tiktok_ads"].ping = AsyncMock(return_value=True)
        manager.clients["linkedin_ads"].ping = AsyncMock(return_value=False)

        health = await manager.health_check()

        assert health["google_ads"] is True
        assert health["meta_ads"] is False
        assert health["tiktok_ads"] is True
        assert health["linkedin_ads"] is False

    @pytest.mark.asyncio
    async def test_close_all(self, manager):
        for client in manager.clients.values():
            client.close = AsyncMock()

        await manager.close_all()

        for client in manager.clients.values():
            client.close.assert_called_once()


class TestBudgetConversion:
    """Tests for budget format conversion"""

    @pytest.fixture
    def manager(self):
        config = MCPConfig()
        with patch("app.services.platform_manager.settings") as mock_settings:
            mock_settings.mcp_host = "localhost"
            mock_settings.mcp_google_ads_port = 3001
            mock_settings.mcp_meta_ads_port = 3002
            mock_settings.mcp_tiktok_ads_port = 3003
            mock_settings.mcp_linkedin_ads_port = 3004
            return PlatformManager(config)

    @pytest.mark.asyncio
    async def test_small_budget_conversion(self, manager):
        """Test $1 budget converts correctly"""
        with patch.object(
            manager.clients["google_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = {"success": True}

            await manager.update_campaign_budget("google_ads", "123", 1.00)

            call_args = mock_call.call_args[0][1]
            assert call_args["new_budget_micros"] == 1_000_000

    @pytest.mark.asyncio
    async def test_large_budget_conversion(self, manager):
        """Test $10,000 budget converts correctly"""
        with patch.object(
            manager.clients["google_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = {"success": True}

            await manager.update_campaign_budget("google_ads", "123", 10000.00)

            call_args = mock_call.call_args[0][1]
            assert call_args["new_budget_micros"] == 10_000_000_000

    @pytest.mark.asyncio
    async def test_fractional_budget_conversion(self, manager):
        """Test $50.50 budget converts correctly"""
        with patch.object(
            manager.clients["google_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = {"success": True}

            await manager.update_campaign_budget("google_ads", "123", 50.50)

            call_args = mock_call.call_args[0][1]
            assert call_args["new_budget_micros"] == 50_500_000


class TestPlatformSpecificBehavior:
    """Tests for platform-specific behavior"""

    @pytest.fixture
    def manager(self):
        config = MCPConfig()
        with patch("app.services.platform_manager.settings") as mock_settings:
            mock_settings.mcp_host = "localhost"
            mock_settings.mcp_google_ads_port = 3001
            mock_settings.mcp_meta_ads_port = 3002
            mock_settings.mcp_tiktok_ads_port = 3003
            mock_settings.mcp_linkedin_ads_port = 3004
            return PlatformManager(config)

    def test_google_ads_uses_correct_port(self, manager):
        client = manager.clients["google_ads"]
        assert "3001" in client.server_url

    def test_meta_ads_uses_correct_port(self, manager):
        client = manager.clients["meta_ads"]
        assert "3002" in client.server_url

    def test_tiktok_ads_uses_correct_port(self, manager):
        client = manager.clients["tiktok_ads"]
        assert "3003" in client.server_url

    def test_linkedin_ads_uses_correct_port(self, manager):
        client = manager.clients["linkedin_ads"]
        assert "3004" in client.server_url

    def test_each_platform_has_unique_server_name(self, manager):
        names = [client.server_name for client in manager.clients.values()]
        assert len(names) == len(set(names))

    @pytest.mark.asyncio
    async def test_tiktok_uses_standard_budget(self, manager):
        """TikTok uses standard currency like Meta"""
        with patch.object(
            manager.clients["tiktok_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = {"success": True}

            await manager.update_campaign_budget("tiktok_ads", "123", 75.00)

            call_args = mock_call.call_args[0][1]
            assert call_args["new_budget"] == 75.00

    @pytest.mark.asyncio
    async def test_linkedin_uses_standard_budget(self, manager):
        """LinkedIn uses standard currency"""
        with patch.object(
            manager.clients["linkedin_ads"], "call_tool", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = {"success": True}

            await manager.update_campaign_budget("linkedin_ads", "123", 200.00)

            call_args = mock_call.call_args[0][1]
            assert call_args["new_budget"] == 200.00
