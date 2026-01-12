# MBO Backend

Python FastAPI backend for Marketing Budget Optimizer.

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp ../.env.example .env
# Edit .env with your credentials

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

## Development

```bash
# Run tests
pytest

# Run single test
pytest tests/test_file.py -k test_name

# Run with coverage
pytest --cov=app

# Type checking
mypy app

# Linting
ruff check app
ruff format app
```

## API Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependency status
- `GET /api/campaigns/performance` - Get campaign performance
- `PUT /api/campaigns/{id}/budget` - Update campaign budget
- `POST /api/campaigns/{id}/pause` - Pause campaign
- `POST /api/campaigns/{id}/resume` - Resume campaign
- `POST /api/ai/analyze` - Trigger AI analysis
- `GET /api/ai/recommendations` - Get AI recommendations

## Celery Tasks

```bash
# Start worker
celery -A app.tasks worker --loglevel=info

# Start beat scheduler (for periodic tasks)
celery -A app.tasks beat --loglevel=info

# Monitor with Flower (optional)
pip install flower
celery -A app.tasks flower
```

## Project Structure

```
backend/
├── app/
│   ├── core/           # Config, database, auth
│   ├── models/         # SQLAlchemy models
│   ├── services/       # Business logic
│   │   ├── mcp_client.py      # MCP JSON-RPC client
│   │   ├── platform_manager.py # Platform abstraction
│   │   └── ai_engine.py       # Claude integration
│   ├── api/            # FastAPI routes
│   └── tasks/          # Celery async tasks
├── alembic/            # Database migrations
├── tests/              # Test files
└── requirements.txt
```
