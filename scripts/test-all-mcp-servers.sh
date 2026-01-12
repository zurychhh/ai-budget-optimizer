#!/bin/bash
# Test all MCP Servers
# Usage: ./scripts/test-all-mcp-servers.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "=================================================="
echo "  Testing All MCP Servers"
echo "=================================================="
echo ""

# Test function
test_server() {
    local name=$1
    local dir=$2

    echo -e "${YELLOW}=== Testing $name ===${NC}"

    # Test list tools
    echo "Listing tools..."
    TOOLS=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
        node "$dir/dist/index.js" 2>/dev/null | \
        python3 -c "import sys, json; data=json.load(sys.stdin); tools=data.get('result',{}).get('tools',[]); print(len(tools))")

    if [ "$TOOLS" = "4" ]; then
        echo -e "${GREEN}  ✓ Found 4 tools${NC}"
    else
        echo -e "${RED}  ✗ Expected 4 tools, got $TOOLS${NC}"
        return 1
    fi

    # Test get_campaign_performance
    echo "Testing get_campaign_performance..."
    RESULT=$(echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_campaign_performance","arguments":{"date_range":{"start_date":"2026-01-01","end_date":"2026-01-07"}}}}' | \
        node "$dir/dist/index.js" 2>/dev/null | \
        python3 -c "import sys, json; data=json.load(sys.stdin); result=data.get('result',{}); content=result.get('content',[{}])[0]; text=json.loads(content.get('text','{}')); print(text.get('count', 0))")

    if [ "$RESULT" -gt 0 ]; then
        echo -e "${GREEN}  ✓ Returned $RESULT campaigns${NC}"
    else
        echo -e "${RED}  ✗ No campaigns returned${NC}"
        return 1
    fi

    # Test pause_campaign
    echo "Testing pause_campaign..."
    PAUSE=$(echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"pause_campaign","arguments":{"campaign_id":"test123"}}}' | \
        node "$dir/dist/index.js" 2>/dev/null | \
        python3 -c "import sys, json; data=json.load(sys.stdin); result=data.get('result',{}); content=result.get('content',[{}])[0]; text=json.loads(content.get('text','{}')); print(text.get('success', False))")

    if [ "$PAUSE" = "True" ]; then
        echo -e "${GREEN}  ✓ Pause campaign succeeded${NC}"
    else
        echo -e "${RED}  ✗ Pause campaign failed${NC}"
        return 1
    fi

    echo -e "${GREEN}  All tests passed for $name${NC}"
    echo ""
}

# Test each server
test_server "Google Ads MCP" "mcp-servers/google-ads-mcp"
test_server "Meta Ads MCP" "mcp-servers/meta-ads-mcp"
test_server "TikTok Ads MCP" "mcp-servers/tiktok-ads-mcp"
test_server "LinkedIn Ads MCP" "mcp-servers/linkedin-ads-mcp"

echo "=================================================="
echo -e "${GREEN}All MCP Server Tests Passed!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "  - Google Ads MCP:   Port 3001"
echo "  - Meta Ads MCP:     Port 3002"
echo "  - TikTok Ads MCP:   Port 3003"
echo "  - LinkedIn Ads MCP: Port 3004"
echo ""
echo "All servers running in MOCK MODE"
