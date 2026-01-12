"""Platform Manager - Unified interface to all advertising platforms via MCP"""

from dataclasses import dataclass
from typing import Any

from app.core.config import settings

from .mcp_client import MCPClient


@dataclass
class MCPConfig:
    """MCP Server configuration"""

    host: str = "localhost"
    google_ads_port: int = 3001
    meta_ads_port: int = 3002
    tiktok_ads_port: int = 3003
    linkedin_ads_port: int = 3004


class PlatformManager:
    """
    Unified interface to all advertising platforms via MCP.

    Abstracts platform-specific details and provides consistent API
    for campaign management across Google Ads, Meta Ads, TikTok Ads, etc.
    """

    def __init__(self, config: MCPConfig | None = None):
        if config is None:
            config = MCPConfig(
                host=settings.mcp_host,
                google_ads_port=settings.mcp_google_ads_port,
                meta_ads_port=settings.mcp_meta_ads_port,
                tiktok_ads_port=settings.mcp_tiktok_ads_port,
                linkedin_ads_port=settings.mcp_linkedin_ads_port,
            )

        self.config = config
        base_url = f"http://{config.host}"

        # Initialize MCP clients for each platform
        self.clients = {
            "google_ads": MCPClient(
                server_url=f"{base_url}:{config.google_ads_port}",
                server_name="google-ads-mcp",
            ),
            "meta_ads": MCPClient(
                server_url=f"{base_url}:{config.meta_ads_port}",
                server_name="meta-ads-mcp",
            ),
            "tiktok_ads": MCPClient(
                server_url=f"{base_url}:{config.tiktok_ads_port}",
                server_name="tiktok-ads-mcp",
            ),
            "linkedin_ads": MCPClient(
                server_url=f"{base_url}:{config.linkedin_ads_port}",
                server_name="linkedin-ads-mcp",
            ),
        }

    async def get_campaign_performance(
        self,
        platform: str,
        start_date: str,
        end_date: str,
        campaign_ids: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        Fetch campaign performance from any platform.

        Args:
            platform: Platform identifier (google_ads, meta_ads, etc.)
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            campaign_ids: Optional list of campaign IDs to filter

        Returns:
            Dict containing campaign performance data
        """
        client = self._get_client(platform)

        args = {
            "date_range": {
                "start_date": start_date,
                "end_date": end_date,
            }
        }

        if campaign_ids:
            args["campaign_ids"] = campaign_ids

        return await client.call_tool("get_campaign_performance", args)

    async def update_campaign_budget(
        self,
        platform: str,
        campaign_id: str,
        new_budget: float,
    ) -> dict[str, Any]:
        """
        Update campaign budget (handles platform-specific formats).

        Args:
            platform: Platform identifier
            campaign_id: Campaign ID
            new_budget: New budget in USD

        Returns:
            Result of budget update
        """
        client = self._get_client(platform)

        # Convert to platform-specific format
        if platform == "google_ads":
            # Google uses micros (1 USD = 1,000,000 micros)
            budget_value = int(new_budget * 1_000_000)
            arg_name = "new_budget_micros"
        else:
            # Most other platforms use standard currency
            budget_value = new_budget
            arg_name = "new_budget"

        args = {
            "campaign_id": campaign_id,
            arg_name: budget_value,
        }

        return await client.call_tool("update_campaign_budget", args)

    async def pause_campaign(
        self,
        platform: str,
        campaign_id: str,
    ) -> dict[str, Any]:
        """Pause campaign on any platform"""
        client = self._get_client(platform)
        return await client.call_tool("pause_campaign", {"campaign_id": campaign_id})

    async def resume_campaign(
        self,
        platform: str,
        campaign_id: str,
    ) -> dict[str, Any]:
        """Resume paused campaign"""
        client = self._get_client(platform)
        return await client.call_tool("resume_campaign", {"campaign_id": campaign_id})

    async def get_all_campaigns(
        self,
        start_date: str,
        end_date: str,
    ) -> dict[str, Any]:
        """
        Fetch campaigns from all platforms.

        Returns:
            Dict mapping platform names to campaign lists
        """
        results = {}

        for platform in self.clients:
            try:
                results[platform] = await self.get_campaign_performance(
                    platform=platform,
                    start_date=start_date,
                    end_date=end_date,
                )
            except Exception as e:
                results[platform] = {"error": str(e)}

        return results

    async def health_check(self) -> dict[str, bool]:
        """Check health of all MCP servers"""
        results = {}
        for platform, client in self.clients.items():
            try:
                results[platform] = await client.ping()
            except Exception:
                results[platform] = False
        return results

    def _get_client(self, platform: str) -> MCPClient:
        """Get MCP client for platform"""
        if platform not in self.clients:
            raise ValueError(
                f"Unknown platform: {platform}. Available: {list(self.clients.keys())}"
            )
        return self.clients[platform]

    async def close_all(self):
        """Close all MCP client connections"""
        for client in self.clients.values():
            await client.close()
