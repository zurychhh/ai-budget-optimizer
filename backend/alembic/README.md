# Alembic Database Migrations

Database migrations for Marketing Budget Optimizer.

## Usage

```bash
# Ensure you're in the backend directory with venv activated
cd backend
source venv/bin/activate

# Apply all migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# Rollback all migrations
alembic downgrade base

# Check current version
alembic current

# View migration history
alembic history

# Create new migration (after modifying models)
alembic revision --autogenerate -m "Description of changes"
```

## Migration Files

Located in `alembic/versions/`:

- `001_initial_schema.py` - Initial database schema with all tables

## Tables

- `campaigns` - Cross-platform campaign data
- `campaign_metrics` - TimescaleDB hypertable for time-series metrics
- `ai_recommendations` - AI-generated optimization recommendations
- `ai_actions_log` - Audit log of all AI actions
- `budget_allocations` - Budget distribution records
- `alerts` - System alerts and notifications

## TimescaleDB

The `campaign_metrics` table is a TimescaleDB hypertable, optimized for time-series queries.
This is set up automatically by the initial migration.

## Development Notes

1. Always create migrations for schema changes
2. Test migrations in development before production
3. Use `--autogenerate` for automatic detection of model changes
4. Review generated migrations before committing
