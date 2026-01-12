# Marketing Budget Optimizer (MBO)

AI-powered marketing budget management system with real-time optimization using Claude Sonnet.

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    React + TypeScript                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  AI Engine   │  │  Analytics   │  │    Rules     │          │
│  │  (Claude)    │  │   Module     │  │   Engine     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────────────────────────────────────────┐          │
│  │            Platform Manager (MCP Client)          │          │
│  └──────────────────────────────────────────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │ JSON-RPC 2.0
┌────────────────────────────┴────────────────────────────────────┐
│                      MCP SERVERS (TypeScript)                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Google  │  │  Meta   │  │ TikTok  │  │LinkedIn │            │
│  │  :3001  │  │  :3002  │  │  :3003  │  │  :3004  │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    ADVERTISING PLATFORMS                         │
│         Google Ads • Meta Ads • TikTok Ads • LinkedIn Ads        │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- pnpm (for MCP servers)

### 1. Clone and Setup

```bash
# Clone repo
cd marketing-budget-optimizer

# First-time setup (creates venv, installs deps, starts Docker)
./scripts/setup.sh

# Copy and configure environment
cp .env.example .env
# Edit .env with your API credentials
```

### 2. Start Services

```bash
# Start all services (Docker + Backend + MCP servers)
./scripts/start-all.sh

# Or start individually:
docker-compose up -d                    # Infrastructure
cd backend && uvicorn app.main:app     # Backend
cd mcp-servers/google-ads-mcp && npm start  # MCP server
```

### 3. Verify

```bash
# Check all services health
./scripts/healthcheck.sh

# API should respond at:
curl http://localhost:8000/health
```

## Project Structure

```
marketing-budget-optimizer/
├── docs/                     # Detailed documentation
│   ├── 01-overview.md       # Project overview
│   ├── 02-architecture.md   # System architecture
│   ├── 03-ai-integration.md # Claude AI integration
│   └── ...
├── backend/                  # Python FastAPI backend
│   ├── app/
│   │   ├── core/            # Config, auth, database
│   │   ├── models/          # SQLAlchemy models
│   │   ├── services/        # Business logic
│   │   ├── api/             # API routes
│   │   └── tasks/           # Celery async tasks
│   ├── alembic/             # Database migrations
│   └── tests/
├── mcp-servers/             # TypeScript MCP servers
│   ├── shared/              # Shared utilities
│   ├── google-ads-mcp/      # Port 3001
│   ├── meta-ads-mcp/        # Port 3002
│   ├── tiktok-ads-mcp/      # Port 3003
│   └── linkedin-ads-mcp/    # Port 3004
├── frontend/                # React frontend (coming soon)
├── infrastructure/          # Docker, PM2, nginx configs
└── scripts/                 # Utility scripts
```

## Key Features

- **Multi-Platform Management**: Google Ads, Meta, TikTok, LinkedIn from one interface
- **AI-Powered Optimization**: Claude Sonnet analyzes performance and recommends budget allocation
- **Autonomous Mode**: AI can execute optimizations automatically (with confidence thresholds)
- **Real-time Monitoring**: 15-minute data refresh cycle with anomaly detection
- **Natural Language Queries**: Ask questions about your campaigns in plain language

## Automation Levels

| Level | Description | Human Involvement |
|-------|-------------|-------------------|
| **Full Autonomous** | AI executes actions if confidence > 85% | ~20 min/day |
| **Semi-Autonomous** | AI proposes, human approves each action | ~2 hours/day |
| **Advisory Only** | AI only analyzes and suggests | Full manual control |

## Documentation

See `docs/README.md` for complete documentation:

- [Overview](docs/01-overview.md) - Project goals and tech stack
- [Architecture](docs/02-architecture.md) - System design
- [AI Integration](docs/03-ai-integration.md) - Claude prompts and use cases
- [Autonomous Optimization](docs/04-autonomous-optimization.md) - Automation logic
- [Data Model](docs/05-data-model.md) - Database schema
- [Platform Setup](docs/07-platform-setup.md) - API credentials guide
- [Deployment](docs/08-deployment.md) - Production deployment

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Celery |
| Database | PostgreSQL 15 + TimescaleDB |
| Cache | Redis 7 |
| Queue | RabbitMQ |
| MCP Servers | TypeScript, @modelcontextprotocol/sdk |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Frontend | React 18, TypeScript, Tailwind CSS |

## Development

```bash
# Run backend tests
cd backend && pytest

# Run single test
pytest tests/test_file.py -k test_name

# Start Celery worker
celery -A app.tasks worker --loglevel=info

# View MCP server logs
pm2 logs google-ads-mcp --lines 50
```

## License

Proprietary - All rights reserved
