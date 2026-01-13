# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Marketing Budget Optimizer (MBO)** - AI-powered marketing budget management across advertising platforms (Google Ads, Meta, TikTok, LinkedIn) with real-time optimization using Claude Sonnet.

**Status:** ✅ Backend, ✅ Frontend, ✅ Auth (JWT + RBAC), ✅ MCP Servers (mock), ✅ Tests (342), ✅ CI/CD Pipeline

**Repository:** https://github.com/zurychhh/ai-budget-optimizer (public)

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
pytest                          # All tests (159 passing)
pytest --cov=app                # With coverage

# Frontend (React/TypeScript)
cd frontend
npm install
npm run dev                     # Dev server on :5173
npm run build                   # Production build
npm test                        # All tests (100 passing)
npm test -- --coverage          # With coverage

# MCP Servers (TypeScript)
cd mcp-servers/google-ads-mcp
npm install && npm run build && npm start
npm test                        # Tests (48 passing)

cd mcp-servers/meta-ads-mcp
npm install && npm run build && npm start
npm test                        # Tests (35 passing)

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
     ↓                   ↓                    ↓
  Zustand +         AI Engine            JSON-RPC 2.0
  TanStack Query    (Claude)
                         ↓
                PostgreSQL/TimescaleDB + Redis
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `app/main.py` | Backend entry | FastAPI app, routers, CORS |
| `app/core/security.py` | Auth | JWT tokens, password hashing |
| `app/api/auth.py` | Auth endpoints | Login, register, refresh, me |
| `app/api/deps.py` | Dependencies | get_current_user, require_role |
| `app/services/platform_manager.py` | MCP Client | Unified API to all ad platforms |
| `app/services/ai_engine.py` | AI | Claude integration, analysis |
| `mcp-servers/shared/` | MCP Shared | Base server class, common types |
| `mcp-servers/*-mcp/` | MCP Servers | Platform-specific implementations |
| `src/store/authStore.ts` | Frontend auth | Zustand auth state, RBAC |
| `src/api/client.ts` | API client | Axios + interceptors |
| `src/hooks/useQueries.ts` | Data fetching | React Query hooks |
| `src/components/ProtectedRoute.tsx` | Route guard | Auth + role protection |

### Authentication & Authorization

JWT-based auth with role hierarchy:
```
ADMIN → MANAGER → ANALYST → VIEWER
  ↓        ↓         ↓         ↓
 all    budgets   analysis   read-only
```

Token flow:
1. Login returns access_token (30min) + refresh_token (7 days)
2. Axios interceptor adds `Authorization: Bearer {token}`
3. On 401, auto-refresh and retry request
4. On refresh failure, redirect to /login

### Platform Manager Pattern

Abstracts platform differences through unified interface:
```python
manager = PlatformManager()
await manager.get_campaign_performance("google_ads", start_date, end_date)
await manager.update_campaign_budget("meta_ads", campaign_id, new_budget)  # Handles micros conversion
```

### MCP Server Ports

| Server | Port | Status |
|--------|------|--------|
| google-ads-mcp | 3001 | ✅ Mock mode |
| meta-ads-mcp | 3002 | ✅ Mock mode |
| tiktok-ads-mcp | 3003 | 🔲 Scaffold only |
| linkedin-ads-mcp | 3004 | 🔲 Scaffold only |

Each exposes: `get_campaign_performance`, `update_campaign_budget`, `pause_campaign`, `resume_campaign`

### Automation Levels

- **FULL_AUTONOMOUS:** AI executes if confidence > 85% (`CONFIDENCE_THRESHOLD`)
- **SEMI_AUTONOMOUS:** AI proposes, human approves
- **ADVISORY_ONLY:** AI analyzes and suggests only

## Test Suite

| Component | Tests | Status |
|-----------|-------|--------|
| Backend (pytest) | 159 | ✅ Passing |
| Google Ads MCP (vitest) | 48 | ✅ Passing |
| Meta Ads MCP (vitest) | 35 | ✅ Passing |
| Frontend (vitest) | 100 | ✅ Passing |
| **Total** | **342** | ✅ All passing |

### Frontend Test Coverage

| File | Coverage |
|------|----------|
| ProtectedRoute.tsx | 100% |
| useQueries.ts | 100% |
| Login.tsx | 95% |
| client.ts | 77.5% |
| authStore.ts | - (Zustand) |

## Database

Key tables (see `backend/app/models/` and `docs/05-data-model.md`):
- `users` - User accounts with roles
- `campaigns` - Cross-platform campaign data
- `campaign_metrics` - TimescaleDB hypertable for time-series metrics
- `ai_recommendations` - AI suggestions with confidence scores
- `ai_actions_log` - Audit log of executed actions

Migrations: `alembic upgrade head` / `alembic revision --autogenerate -m "message"`

## Environment Variables

See `.env.example`. Key variables:
- `SECRET_KEY` - JWT signing key (generate with `openssl rand -hex 32`)
- `ANTHROPIC_API_KEY` - Required for AI features
- `DATABASE_URL` - PostgreSQL connection
- `GOOGLE_ADS_*`, `META_*`, `TIKTOK_*`, `LINKEDIN_*` - Platform credentials
- `CONFIDENCE_THRESHOLD=0.85`, `MAX_BUDGET_REALLOCATION_PCT=30` - Optimization constraints

## Project Structure

```
marketing-budget-optimizer/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py            # Entry point
│   │   ├── core/              # Config, security, database
│   │   ├── models/            # SQLAlchemy models (User, Campaign, etc.)
│   │   ├── services/          # Business logic (ai_engine, platform_manager)
│   │   ├── api/               # Routes (auth, campaigns, ai)
│   │   └── tasks/             # Celery async tasks
│   └── tests/                 # pytest tests (159)
├── frontend/                   # React TypeScript frontend
│   ├── src/
│   │   ├── api/               # Axios client + types
│   │   ├── components/        # UI components (ProtectedRoute, dashboard, layout)
│   │   ├── hooks/             # React Query hooks
│   │   ├── pages/             # Page components (Login, Dashboard, etc.)
│   │   ├── store/             # Zustand stores (authStore)
│   │   └── test/              # Test setup + utils
│   └── package.json
├── mcp-servers/               # TypeScript MCP servers
│   ├── shared/                # Base classes, types
│   ├── google-ads-mcp/        # Port 3001 (48 tests)
│   └── meta-ads-mcp/          # Port 3002 (35 tests)
├── docs/                      # Documentation
└── scripts/                   # Shell scripts
```

## CI/CD Pipeline

**GitHub Actions** runs on every push/PR to `main` and `develop`:

| Job | Description | Time |
|-----|-------------|------|
| `backend-lint` | Ruff + MyPy type check | ~30s |
| `backend-test` | 159 tests + Postgres/Redis services | ~2min |
| `frontend-lint` | ESLint + TypeScript check | ~30s |
| `frontend-test` | 100 Vitest tests | ~1min |
| `frontend-build` | Vite production build | ~30s |
| `mcp-servers-tested` | Google Ads (48) + Meta Ads (35) tests | ~1min |
| `mcp-servers-scaffold` | TikTok + LinkedIn typecheck/build | ~30s |
| `ci-success` | Final gate check | ~5s |

**Branch Protection (main):**
- Require PR with 1 approval
- Require `ci-success` status check
- Require up-to-date branch
- Block force push and deletions

**Dependabot:** Weekly updates for pip, npm, github-actions

## Documentation

Detailed docs in `docs/`:
- `02-architecture.md` - System architecture
- `03-ai-integration.md` - Claude prompts and patterns
- `04-autonomous-optimization.md` - Optimization loop logic
- `05-data-model.md` - Full database schema
- `07-platform-setup.md` - Platform API credentials guide

## Next Steps (Priority Order)

1. **Dashboard UI** - Build main dashboard with campaign metrics, charts, platform comparison
2. **Real API Integrations** - Connect MCP servers to actual Google Ads/Meta APIs
3. **AI Engine Enhancement** - Implement full optimization loop with Claude analysis
4. **E2E Tests** - Playwright tests for critical user flows
5. **Docker Production** - Kubernetes/Docker Compose for production deployment
6. **Monitoring** - Sentry, Prometheus, Grafana dashboards
