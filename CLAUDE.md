# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Marketing Budget Optimizer (MBO)** - AI-powered marketing budget management across advertising platforms (Google Ads, Meta, TikTok, LinkedIn) with real-time optimization using Claude Sonnet.

**Status:** Infrastructure and backend bootstrapped. Frontend and full MCP server implementations pending.

## Commands

```bash
# Setup & Infrastructure
./scripts/setup.sh              # First-time setup
docker-compose up -d            # Start PostgreSQL, Redis, RabbitMQ
./scripts/healthcheck.sh        # Verify all services

# Backend (Python/FastAPI)
cd backend
source venv/bin/activate
alembic upgrade head            # Run migrations
uvicorn app.main:app --reload --port 8000

# Testing
cd backend
pytest                          # All tests
pytest tests/test_file.py -k test_name  # Single test
pytest --cov=app                # With coverage

# Linting & Type Checking
cd backend
ruff check .                    # Lint
mypy app                        # Type check

# MCP Servers (TypeScript)
cd mcp-servers/google-ads-mcp
npm install && npm run build && npm start

# Celery Worker
cd backend && celery -A app.tasks worker --loglevel=info

# All Services
./scripts/start-all.sh
./scripts/stop-all.sh
./scripts/test-all-mcp-servers.sh
```

## Architecture

```
Frontend (React) → Backend (FastAPI) → MCP Servers (TS) → Ad Platforms
                        ↓                    ↓
                   AI Engine            JSON-RPC 2.0
                   (Claude)
                        ↓
               PostgreSQL/TimescaleDB + Redis
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `app/main.py` | Backend entry | FastAPI app, routers, CORS |
| `app/core/config.py` | Settings | Pydantic settings from env |
| `app/services/platform_manager.py` | MCP Client | Unified API to all ad platforms |
| `app/services/ai_engine.py` | AI | Claude integration, analysis, recommendations |
| `app/api/ai.py` | AI Endpoints | /api/ai/* routes for analysis, optimization |
| `app/api/campaigns.py` | Campaign Endpoints | CRUD operations for campaigns |
| `mcp-servers/shared/` | MCP Shared | Base server class, common types |
| `mcp-servers/*-mcp/` | MCP Servers | Platform-specific implementations (ports 3001-3004) |

### Platform Manager Pattern

Abstracts platform differences through unified interface:
```python
manager = PlatformManager()
await manager.get_campaign_performance("google_ads", start_date, end_date)
await manager.update_campaign_budget("meta_ads", campaign_id, new_budget)  # Handles micros conversion
```

### MCP Server Ports

| Server | Port |
|--------|------|
| google-ads-mcp | 3001 |
| meta-ads-mcp | 3002 |
| tiktok-ads-mcp | 3003 |
| linkedin-ads-mcp | 3004 |

Each exposes: `get_campaign_performance`, `update_campaign_budget`, `pause_campaign`, `resume_campaign`

### Automation Levels

- **FULL_AUTONOMOUS:** AI executes if confidence > 85% (`CONFIDENCE_THRESHOLD`)
- **SEMI_AUTONOMOUS:** AI proposes, human approves
- **ADVISORY_ONLY:** AI analyzes and suggests only

## Database

Key tables (see `backend/app/models/` and `docs/05-data-model.md`):
- `campaigns` - Cross-platform campaign data
- `campaign_metrics` - TimescaleDB hypertable for time-series metrics
- `ai_recommendations` - AI suggestions with confidence scores
- `ai_actions_log` - Audit log of executed actions

Migrations: `alembic upgrade head` / `alembic revision --autogenerate -m "message"`

## Environment Variables

See `.env.example`. Key variables:
- `ANTHROPIC_API_KEY` - Required for AI features
- `DATABASE_URL` - PostgreSQL connection
- `GOOGLE_ADS_*`, `META_*`, `TIKTOK_*`, `LINKEDIN_*` - Platform credentials
- `CONFIDENCE_THRESHOLD=0.85`, `MAX_BUDGET_REALLOCATION_PCT=30` - Optimization constraints

## Testing Patterns

Tests use `pytest` with `FastAPI.TestClient`:
```python
@pytest.fixture
def client():
    return TestClient(app)

def test_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
```

Async tests require `pytest-asyncio`.

## Documentation

Detailed docs in `docs/`:
- `02-architecture.md` - System architecture
- `03-ai-integration.md` - Claude prompts and patterns
- `04-autonomous-optimization.md` - Optimization loop logic
- `05-data-model.md` - Full database schema
- `07-platform-setup.md` - Platform API credentials guide
