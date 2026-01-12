#!/bin/bash
# Marketing Budget Optimizer - Health Check Script
# Checks the status of all services

echo "=================================================="
echo "  Marketing Budget Optimizer - Health Check"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo ""
echo "Checking services..."
echo ""

# Track overall status
ALL_OK=true

# Function to check service
check_service() {
    local name=$1
    local check_command=$2
    local port=$3

    printf "%-20s" "$name:"

    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC} (port $port)"
    else
        echo -e "${RED}FAIL${NC}"
        ALL_OK=false
    fi
}

# Check Docker services
echo "=== Docker Services ==="

check_service "PostgreSQL" "docker exec mbo-postgres pg_isready -U mbo_user" "5432"
check_service "Redis" "docker exec mbo-redis redis-cli ping" "6379"
check_service "RabbitMQ" "docker exec mbo-rabbitmq rabbitmq-diagnostics -q ping" "5672"

echo ""
echo "=== Application Services ==="

# Check Backend API
printf "%-20s" "Backend API:"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    RESPONSE=$(curl -s http://localhost:8000/health)
    echo -e "${GREEN}OK${NC} (port 8000)"
else
    echo -e "${RED}FAIL${NC}"
    ALL_OK=false
fi

# Check detailed health (optional)
printf "%-20s" "DB Connection:"
if curl -s http://localhost:8000/health/detailed 2>/dev/null | grep -q '"postgres".*"healthy"'; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}UNKNOWN${NC} (API may not be running)"
fi

echo ""
echo "=== MCP Servers ==="

# Check MCP servers (if running)
for port in 3001 3002 3003 3004; do
    case $port in
        3001) name="Google Ads MCP" ;;
        3002) name="Meta Ads MCP" ;;
        3003) name="TikTok Ads MCP" ;;
        3004) name="LinkedIn Ads MCP" ;;
    esac

    printf "%-20s" "$name:"
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}OK${NC} (port $port)"
    else
        echo -e "${YELLOW}NOT RUNNING${NC} (port $port)"
    fi
done

echo ""
echo "=== Process Status ==="

# Check for running processes
printf "%-20s" "Uvicorn:"
if pgrep -f "uvicorn app.main" > /dev/null; then
    echo -e "${GREEN}RUNNING${NC}"
else
    echo -e "${YELLOW}NOT RUNNING${NC}"
fi

printf "%-20s" "Celery Worker:"
if pgrep -f "celery -A app.tasks worker" > /dev/null; then
    echo -e "${GREEN}RUNNING${NC}"
else
    echo -e "${YELLOW}NOT RUNNING${NC}"
fi

echo ""
echo "=================================================="
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}All core services are healthy!${NC}"
else
    echo -e "${RED}Some services are not healthy. Check the logs.${NC}"
fi
echo "=================================================="
echo ""

# Show log locations
echo "Log files:"
echo "  Backend:  logs/backend.log"
echo "  Celery:   logs/celery-worker.log"
echo "  Docker:   docker-compose logs [service_name]"
echo ""
