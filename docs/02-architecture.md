# System Architecture

## Architektura Wysokopoziomowa

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web UI    │  │  Mobile App │  │  CLI Tool   │        │
│  │  (React)    │  │  (React N.) │  │  (Python)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              CORE ORCHESTRATION LAYER                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Marketing Budget Optimizer (MBO)             │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ AI Engine  │  │ Analytics  │  │   Rules    │    │  │
│  │  │  (Claude)  │  │   Module   │  │   Engine   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  │  ┌────────────────────────────────────────────────┐│  │
│  │  │      Data Normalization & ETL Pipeline        ││  │
│  │  └────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│            INTEGRATION LAYER (MCP/API/CLI)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   MCP    │ │ REST API │ │   CLI    │ │ Webhooks │      │
│  │ Servers  │ │ Clients  │ │ Scripts  │ │ Handlers │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              PLATFORM CONNECTORS LAYER                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Google  │ │  Meta   │ │ TikTok  │ │LinkedIn │   ...    │
│  │  Ads    │ │   Ads   │ │   Ads   │ │   Ads   │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Core Orchestration Layer (Backend)

### Technology Stack
- **Language:** Python 3.11+ (FastAPI)
- **Database:** PostgreSQL 15+ (główna baza) + TimescaleDB (time-series data)
- **Cache:** Redis 7+ (real-time data, session management)
- **Message Queue:** RabbitMQ (async processing)
- **AI/LLM:** Anthropic Claude Sonnet API

### Główne Moduły

#### 1. AI Engine (Claude Integration)
```python
class AIOptimizationEngine:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=config.CLAUDE_API_KEY)
        self.model = "claude-sonnet-4-20250514"

    async def analyze_performance(self, campaign_data):
        """Analiza wydajności kampanii przez Claude"""

    async def recommend_budget_allocation(self, historical_data, constraints):
        """Rekomendacje alokacji budżetu"""

    async def predict_roi(self, scenario_data):
        """Predykcja ROI dla różnych scenariuszy"""
```

#### 2. Analytics Module
- Multi-touch attribution modeling
- Customer journey tracking
- ROI/ROAS calculations
- Performance forecasting
- Anomaly detection

#### 3. Rules Engine
- Budget caps i guardrails
- Automated bid adjustments
- Campaign pause/resume triggers
- Alert system

#### 4. Data Normalization Pipeline
```
├── extractors/
│   ├── google_ads_extractor.py
│   ├── meta_ads_extractor.py
│   ├── tiktok_ads_extractor.py
│   └── ...
├── transformers/
│   ├── metrics_normalizer.py
│   ├── currency_converter.py
│   └── attribution_calculator.py
└── loaders/
    ├── timeseries_loader.py
    └── analytics_loader.py
```

## Integration Layer

### 1. MCP (Model Context Protocol) Servers

MCP jest KLUCZOWĄ technologią dla tego projektu - pozwala na standaryzację komunikacji między AI a platformami marketingowymi.

```typescript
// Przykład MCP Server dla Google Ads
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "google-ads-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
    resources: {}
  }
});

// Tools for Claude to use
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_campaign_performance",
      description: "Fetch campaign performance metrics",
      inputSchema: { /* ... */ }
    },
    {
      name: "update_campaign_budget",
      description: "Update budget for a specific campaign",
      inputSchema: { /* ... */ }
    },
    {
      name: "pause_campaign",
      description: "Pause underperforming campaign",
      inputSchema: { /* ... */ }
    }
  ]
}));
```

**Planowane MCP Servers:**
| Server | Port | Description |
|--------|------|-------------|
| `google-ads-mcp` | 3001 | Google Ads integration |
| `meta-ads-mcp` | 3002 | Meta (Facebook/Instagram) integration |
| `tiktok-ads-mcp` | 3003 | TikTok Ads integration |
| `linkedin-ads-mcp` | 3004 | LinkedIn Ads integration |
| `analytics-mcp` | 3005 | GA4 & internal analytics |
| `whatsapp-business-mcp` | 3006 | WhatsApp Business API |

### 2. REST API Layer

```python
# FastAPI Router Structure
from fastapi import APIRouter, Depends
from typing import List

router = APIRouter(prefix="/api/v1")

@router.get("/campaigns")
async def get_all_campaigns(
    platforms: List[str] = None,
    date_range: DateRange = None
):
    """Fetch campaigns from all platforms"""

@router.post("/campaigns/{campaign_id}/budget")
async def update_campaign_budget(
    campaign_id: str,
    new_budget: BudgetUpdate
):
    """Update campaign budget"""

@router.get("/optimization/recommendations")
async def get_ai_recommendations(
    account_id: str
):
    """Get AI-powered optimization recommendations"""
```

### 3. CLI Tool

```bash
# Marketing Budget Optimizer CLI
mbo --help

Commands:
  mbo status              # Show current status of all campaigns
  mbo optimize            # Get AI optimization recommendations
  mbo budget set          # Set budget for specific campaign
  mbo report              # Generate performance report
  mbo sync                # Sync data from all platforms
  mbo dashboard           # Launch interactive dashboard
```

## Platform Connectors

### Abstract Base Connector Pattern

```python
from abc import ABC, abstractmethod

class PlatformConnector(ABC):
    def __init__(self, credentials: dict):
        self.credentials = credentials
        self.client = None

    @abstractmethod
    async def authenticate(self) -> bool:
        """Authenticate with platform"""

    @abstractmethod
    async def get_campaigns(self, filters: dict) -> List[Campaign]:
        """Fetch campaigns"""

    @abstractmethod
    async def get_metrics(self, campaign_ids: List[str],
                         date_range: DateRange) -> pd.DataFrame:
        """Fetch performance metrics"""

    @abstractmethod
    async def update_budget(self, campaign_id: str,
                           new_budget: float) -> bool:
        """Update campaign budget"""

    @abstractmethod
    async def pause_campaign(self, campaign_id: str) -> bool:
        """Pause campaign"""

# Concrete Implementation Example
class GoogleAdsConnector(PlatformConnector):
    def __init__(self, credentials: dict):
        super().__init__(credentials)

    async def authenticate(self) -> bool:
        from google.ads.googleads.client import GoogleAdsClient
        self.client = GoogleAdsClient.load_from_dict(self.credentials)
        return True

    async def get_campaigns(self, filters: dict) -> List[Campaign]:
        # Implementation using Google Ads API
        pass
```

## Project Directory Structure

```
marketing-budget-optimizer/
├── mbo-backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI entry point
│   │   ├── core/
│   │   │   ├── config.py          # Settings from .env
│   │   │   ├── auth.py            # Authentication
│   │   │   └── database.py        # DB connection
│   │   ├── models/                # SQLAlchemy models
│   │   ├── services/
│   │   │   ├── mcp_client.py      # MCP JSON-RPC client
│   │   │   ├── platform_manager.py # Platform abstraction
│   │   │   ├── ai_engine.py       # Claude integration
│   │   │   └── analytics.py       # Data analysis
│   │   ├── api/                   # API routes
│   │   │   ├── campaigns.py
│   │   │   ├── analytics.py
│   │   │   └── ai.py
│   │   └── tasks/                 # Celery tasks
│   ├── alembic/                   # DB migrations
│   ├── tests/
│   ├── requirements.txt
│   ├── .env                       # Credentials (gitignored!)
│   └── README.md
│
├── mbo-mcp-servers/               # MCP servers (TypeScript)
│   ├── google-ads-mcp/
│   │   ├── src/
│   │   │   ├── index.ts           # Main server
│   │   │   ├── config.ts          # Load from .env
│   │   │   ├── tools/             # Tool implementations
│   │   │   └── types.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── dist/                  # Compiled JS
│   ├── meta-ads-mcp/
│   ├── tiktok-ads-mcp/
│   └── linkedin-ads-mcp/
│
├── mbo-frontend/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── package.json
│   └── public/
│
├── docker-compose.yml             # Infrastructure
├── ecosystem.config.js            # PM2 config
├── scripts/
│   ├── start-all.sh
│   ├── stop-all.sh
│   └── healthcheck.sh
└── docs/
    ├── API.md
    └── DEPLOYMENT.md
```

## Related Documents

- [AI Integration](./03-ai-integration.md) - Szczegóły integracji z Claude
- [Data Model](./05-data-model.md) - Schema bazy danych
- [Deployment](./08-deployment.md) - Docker, PM2, skrypty
