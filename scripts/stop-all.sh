#!/bin/bash
# Marketing Budget Optimizer - Stop All Services

echo "=================================================="
echo "  Marketing Budget Optimizer - Stopping Services"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo -e "\n${YELLOW}[1/3] Stopping backend processes...${NC}"

# Stop FastAPI
if [ -f logs/backend.pid ]; then
    PID=$(cat logs/backend.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "Stopped FastAPI server (PID: $PID)"
    fi
    rm logs/backend.pid
fi

# Stop Celery worker
if [ -f logs/celery-worker.pid ]; then
    PID=$(cat logs/celery-worker.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "Stopped Celery worker (PID: $PID)"
    fi
    rm logs/celery-worker.pid
fi

# Also try to kill any remaining uvicorn/celery processes
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "celery -A app.tasks" 2>/dev/null || true

echo -e "\n${YELLOW}[2/3] Stopping MCP servers (if running via PM2)...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 stop all 2>/dev/null || echo "No PM2 processes running"
fi

echo -e "\n${YELLOW}[3/3] Stopping Docker services...${NC}"
docker-compose down

echo ""
echo "=================================================="
echo -e "${GREEN}  All Services Stopped!${NC}"
echo "=================================================="
echo ""
echo "To start again: ./scripts/start-all.sh"
echo ""
