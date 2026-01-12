#!/bin/bash
# Test MCP Server manually
# Usage: ./scripts/test-mcp-server.sh

set -e

echo "=================================================="
echo "  MCP Server Manual Test"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if MCP server is built
if [ ! -d "mcp-servers/google-ads-mcp/dist" ]; then
    echo -e "${YELLOW}Building Google Ads MCP server...${NC}"
    cd mcp-servers/google-ads-mcp
    npm install
    npm run build
    cd "$PROJECT_ROOT"
fi

echo ""
echo -e "${YELLOW}Testing MCP Server with JSON-RPC requests...${NC}"
echo ""

# Test 1: List tools
echo "=== Test 1: List Available Tools ==="
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
    node mcp-servers/google-ads-mcp/dist/index.js 2>/dev/null | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data.get('result', data), indent=2))"

echo ""

# Test 2: Get campaign performance
echo "=== Test 2: Get Campaign Performance ==="
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_campaign_performance","arguments":{"date_range":{"start_date":"2026-01-01","end_date":"2026-01-07"}}}}' | \
    node mcp-servers/google-ads-mcp/dist/index.js 2>/dev/null | \
    python3 -c "import sys, json; data=json.load(sys.stdin); result=data.get('result', data); content=result.get('content', [{}])[0]; print(content.get('text', json.dumps(result, indent=2)))"

echo ""

# Test 3: Pause campaign (mock)
echo "=== Test 3: Pause Campaign (Mock) ==="
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"pause_campaign","arguments":{"campaign_id":"123456789"}}}' | \
    node mcp-servers/google-ads-mcp/dist/index.js 2>/dev/null | \
    python3 -c "import sys, json; data=json.load(sys.stdin); result=data.get('result', data); content=result.get('content', [{}])[0]; print(content.get('text', json.dumps(result, indent=2)))"

echo ""

# Test 4: Update budget (mock)
echo "=== Test 4: Update Budget (Mock) ==="
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"update_campaign_budget","arguments":{"campaign_id":"123456789","new_budget_micros":75000000}}}' | \
    node mcp-servers/google-ads-mcp/dist/index.js 2>/dev/null | \
    python3 -c "import sys, json; data=json.load(sys.stdin); result=data.get('result', data); content=result.get('content', [{}])[0]; print(content.get('text', json.dumps(result, indent=2)))"

echo ""
echo "=================================================="
echo -e "${GREEN}All MCP tests completed!${NC}"
echo "=================================================="
echo ""
echo "Note: Server is running in MOCK MODE without real credentials."
echo "Configure credentials in .env for real API calls."
echo ""
