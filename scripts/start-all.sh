#!/bin/bash
# Marketing Budget Optimizer - Start All Services
# Starts Docker infrastructure and backend services

set -e

echo "=================================================="
echo "  Marketing Budget Optimizer - Starting Services"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo -e "\n${YELLOW}[1/3] Starting Docker services...${NC}"
docker-compose up -d

# Wait for services
echo "Waiting for Docker services to be ready..."
sleep 5

# Check Docker services
echo -e "\n${YELLOW}Checking Docker services...${NC}"
docker-compose ps

echo -e "\n${YELLOW}[2/3] Starting backend API...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Run ./scripts/setup.sh first."
    exit 1
fi

source venv/bin/activate

# Start FastAPI in background
echo "Starting FastAPI server on port 8000..."
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
echo $! > ../logs/backend.pid

echo -e "\n${YELLOW}[3/3] Starting Celery worker...${NC}"
mkdir -p ../logs
nohup celery -A app.tasks worker --loglevel=info > ../logs/celery-worker.log 2>&1 &
echo $! > ../logs/celery-worker.pid

cd "$PROJECT_ROOT"

echo ""
echo "=================================================="
echo -e "${GREEN}  All Services Started!${NC}"
echo "=================================================="
echo ""
echo "Services running:"
echo "  - PostgreSQL:    localhost:5432"
echo "  - Redis:         localhost:6379"
echo "  - RabbitMQ:      localhost:5672 (UI: localhost:15672)"
echo "  - Backend API:   localhost:8000"
echo "  - Celery Worker: Running in background"
echo ""
echo "Logs:"
echo "  - Backend:       logs/backend.log"
echo "  - Celery:        logs/celery-worker.log"
echo ""
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "To stop all services: ./scripts/stop-all.sh"
echo ""
