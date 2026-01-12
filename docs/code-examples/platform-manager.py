"""
Platform Manager - Unified interface to all advertising platforms via MCP

This module provides a high-level abstraction for communicating with
multiple ad platforms through their respective MCP servers.
"""

import asyncio
import json
from typing import Any, Dict, List, Optional
import httpx
from dataclasses import dataclass


@dataclass
class MCPConfig:
    """MCP Server configuration"""
    host: str = "localhost"
    google_ads_port: int = 3001
    meta_ads_port: int = 3002
    tiktok_ads_port: int = 3003
    linkedin_ads_port: int = 3004


class MCPClient:
    """JSON-RPC 2.0 client for MCP servers"""

    def __init__(self, server_url: str, server_name: str):
        self.server_url = server_url
        self.server_name = server_name
        self.client = httpx.AsyncClient(timeout=30.0)
        self.request_id = 0

    async def call_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Call an MCP tool and return results

        Args:
            tool_name: Name of the tool to call
            arguments: Tool arguments as dict

        Returns:
            Tool execution result

        Raises:
            Exception: If tool call fails
        """
        self.request_id += 1

        payload = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }

        print(f"[MCP] Calling {self.server_name}.{tool_name}")

        try:
            response = await self.client.post(
                self.server_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()

            result = response.json()

            if "error" in result:
                error_msg = f"MCP Error from {self.server_name}: {result['error']}"
                raise Exception(error_msg)

            print(f"[MCP] {self.server_name}.{tool_name} completed successfully")
            return result.get("result", {})

        except httpx.HTTPError as e:
            error_msg = f"HTTP error calling {self.server_name}: {str(e)}"
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Failed to call {tool_name} on {self.server_name}: {str(e)}"
            raise Exception(error_msg)

    async def list_tools(self) -> List[Dict[str, Any]]:
        """List available tools from MCP server"""
        self.request_id += 1

        payload = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": "tools/list",
            "params": {}
        }

        try:
            response = await self.client.post(self.server_url, json=payload)
            response.raise_for_status()

            result = response.json()
            tools = result.get("result", {}).get("tools", [])

            print(f"[MCP] Listed {len(tools)} tools from {self.server_name}")
            return tools

        except Exception as e:
            print(f"[MCP] Failed to list tools from {self.server_name}: {str(e)}")
            raise

    async def ping(self) -> bool:
        """Check if MCP server is alive"""
        try:
            await self.list_tools()
            return True
        except:
            return False

    async def close(self):
        """Close HTTP client connection"""
        await self.client.aclose()


class PlatformManager:
    """
    Unified interface to all advertising platforms via MCP

    Abstracts platform-specific details and provides consistent API
    for campaign management across Google Ads, Meta Ads, TikTok Ads, etc.
    """

    def __init__(self, config: Optional[MCPConfig] = None):
        self.config = config or MCPConfig()
        base_url = f"http://{self.config.host}"

        # Initialize MCP clients for each platform
        self.clients = {
            "google_ads": MCPClient(
                server_url=f"{base_url}:{self.config.google_ads_port}",
                server_name="google-ads-mcp"
            ),
            "meta_ads": MCPClient(
                server_url=f"{base_url}:{self.config.meta_ads_port}",
                server_name="meta-ads-mcp"
            ),
            "tiktok_ads": MCPClient(
                server_url=f"{base_url}:{self.config.tiktok_ads_port}",
                server_name="tiktok-ads-mcp"
            ),
            "linkedin_ads": MCPClient(
                server_url=f"{base_url}:{self.config.linkedin_ads_port}",
                server_name="linkedin-ads-mcp"
            ),
        }

        print(f"[PlatformManager] Initialized with {len(self.clients)} platforms")

    async def get_campaign_performance(
        self,
        platform: str,
        start_date: str,
        end_date: str,
        campaign_ids: Optional[List[str]] = None
    ) -> Dict:
        """
        Fetch campaign performance from any platform

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
                "end_date": end_date
            }
        }

        if campaign_ids:
            args["campaign_ids"] = campaign_ids

        print(f"[PlatformManager] Fetching performance from {platform}: {start_date} to {end_date}")

        return await client.call_tool("get_campaign_performance", args)

    async def update_campaign_budget(
        self,
        platform: str,
        campaign_id: str,
        new_budget: float
    ) -> Dict:
        """
        Update campaign budget (handles platform-specific formats)

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
            arg_name: budget_value
        }

        print(f"[PlatformManager] Updating budget on {platform}: campaign={campaign_id}, budget=${new_budget}")

        return await client.call_tool("update_campaign_budget", args)

    async def pause_campaign(
        self,
        platform: str,
        campaign_id: str
    ) -> Dict:
        """Pause campaign on any platform"""
        client = self._get_client(platform)

        print(f"[PlatformManager] Pausing campaign on {platform}: {campaign_id}")

        return await client.call_tool(
            "pause_campaign",
            {"campaign_id": campaign_id}
        )

    async def resume_campaign(
        self,
        platform: str,
        campaign_id: str
    ) -> Dict:
        """Resume paused campaign"""
        client = self._get_client(platform)

        print(f"[PlatformManager] Resuming campaign on {platform}: {campaign_id}")

        return await client.call_tool(
            "resume_campaign",
            {"campaign_id": campaign_id}
        )

    async def get_all_campaigns(
        self,
        start_date: str,
        end_date: str
    ) -> Dict[str, List[Dict]]:
        """
        Fetch campaigns from all platforms in parallel

        Returns:
            Dict mapping platform names to campaign lists
        """
        tasks = {}
        for platform in self.clients.keys():
            tasks[platform] = self.get_campaign_performance(
                platform=platform,
                start_date=start_date,
                end_date=end_date
            )

        results = {}
        for platform, task in tasks.items():
            try:
                results[platform] = await task
            except Exception as e:
                print(f"[PlatformManager] Failed to fetch from {platform}: {str(e)}")
                results[platform] = {"error": str(e)}

        return results

    async def health_check(self) -> Dict[str, bool]:
        """Check health of all MCP servers"""
        results = {}
        for platform, client in self.clients.items():
            try:
                results[platform] = await client.ping()
            except:
                results[platform] = False

        return results

    def _get_client(self, platform: str) -> MCPClient:
        """Get MCP client for platform"""
        if platform not in self.clients:
            raise ValueError(
                f"Unknown platform: {platform}. "
                f"Available: {list(self.clients.keys())}"
            )
        return self.clients[platform]

    async def close_all(self):
        """Close all MCP client connections"""
        print("[PlatformManager] Closing all MCP connections")
        for client in self.clients.values():
            await client.close()


# Example usage
async def main():
    """Example usage of PlatformManager"""
    manager = PlatformManager()

    try:
        # Health check
        print("\n=== Health Check ===")
        health = await manager.health_check()
        for platform, status in health.items():
            print(f"  {platform}: {'OK' if status else 'FAIL'}")

        # Get all campaigns
        print("\n=== Fetching All Campaigns ===")
        campaigns = await manager.get_all_campaigns(
            start_date="2026-01-01",
            end_date="2026-01-07"
        )

        for platform, data in campaigns.items():
            if "error" not in data:
                print(f"\n{platform}:")
                print(json.dumps(data, indent=2)[:500] + "...")

        # Update budget example (commented out for safety)
        # print("\n=== Updating Budget ===")
        # result = await manager.update_campaign_budget(
        #     platform="google_ads",
        #     campaign_id="123456789",
        #     new_budget=1500.00
        # )
        # print(json.dumps(result, indent=2))

    finally:
        await manager.close_all()


if __name__ == "__main__":
    asyncio.run(main())
