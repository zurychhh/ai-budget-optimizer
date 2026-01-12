"""JSON-RPC 2.0 client for MCP servers"""

from typing import Any

import httpx


class MCPClient:
    """
    JSON-RPC 2.0 client for communicating with MCP servers.

    Each MCP server exposes tools via the Model Context Protocol.
    This client handles the JSON-RPC communication.
    """

    def __init__(self, server_url: str, server_name: str):
        self.server_url = server_url
        self.server_name = server_name
        self.client = httpx.AsyncClient(timeout=30.0)
        self.request_id = 0

    async def call_tool(
        self,
        tool_name: str,
        arguments: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Call an MCP tool and return results.

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
                "arguments": arguments,
            },
        }

        try:
            response = await self.client.post(
                self.server_url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()

            result = response.json()

            if "error" in result:
                raise Exception(f"MCP Error from {self.server_name}: {result['error']}")

            return result.get("result", {})

        except httpx.HTTPError as e:
            raise Exception(f"HTTP error calling {self.server_name}: {str(e)}")

    async def list_tools(self) -> list[dict[str, Any]]:
        """List available tools from MCP server"""
        self.request_id += 1

        payload = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": "tools/list",
            "params": {},
        }

        try:
            response = await self.client.post(self.server_url, json=payload)
            response.raise_for_status()

            result = response.json()
            return result.get("result", {}).get("tools", [])

        except Exception as e:
            raise Exception(f"Failed to list tools from {self.server_name}: {str(e)}")

    async def ping(self) -> bool:
        """Check if MCP server is alive"""
        try:
            await self.list_tools()
            return True
        except Exception:
            return False

    async def close(self):
        """Close HTTP client connection"""
        await self.client.aclose()
