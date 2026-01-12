#!/bin/bash
# Marketing Budget Optimizer - First-time Setup Script
# Run this once to set up the development environment

set -e  # Exit on error

echo "=================================================="
echo "  Marketing Budget Optimizer - Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo -e "\n${YELLOW}[1/6] Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3.11+${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}All prerequisites found!${NC}"

echo -e "\n${YELLOW}[2/6] Creating environment file...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}Created .env from .env.example${NC}"
    echo -e "${YELLOW}IMPORTANT: Edit .env with your API credentials before running!${NC}"
else
    echo -e "${GREEN}.env file already exists${NC}"
fi

echo -e "\n${YELLOW}[3/6] Starting Docker services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

echo -e "\n${YELLOW}[4/6] Setting up Python backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Created Python virtual environment"
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo -e "\n${YELLOW}[5/6] Running database migrations...${NC}"
# Wait a bit more for PostgreSQL to be fully ready
sleep 5
alembic upgrade head

cd "$PROJECT_ROOT"

echo -e "\n${YELLOW}[6/6] Creating MCP server directories...${NC}"
mkdir -p mcp-servers/shared
mkdir -p mcp-servers/google-ads-mcp/src
mkdir -p mcp-servers/meta-ads-mcp/src
mkdir -p mcp-servers/tiktok-ads-mcp/src
mkdir -p mcp-servers/linkedin-ads-mcp/src
mkdir -p frontend

echo ""
echo "=================================================="
echo -e "${GREEN}  Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API credentials"
echo "  2. Run './scripts/start-all.sh' to start all services"
echo "  3. Visit http://localhost:8000/docs for API documentation"
echo ""
echo "Useful commands:"
echo "  ./scripts/start-all.sh   - Start all services"
echo "  ./scripts/stop-all.sh    - Stop all services"
echo "  ./scripts/healthcheck.sh - Check service health"
echo ""
