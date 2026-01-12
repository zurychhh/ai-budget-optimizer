"""Initial database schema

Revision ID: 001
Revises:
Create Date: 2026-01-07

Creates all initial tables:
- campaigns
- campaign_metrics (TimescaleDB hypertable)
- ai_recommendations
- ai_actions_log
- budget_allocations
- alerts
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Ensure extensions are enabled (should be done in init-db.sql, but just in case)
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Create campaigns table
    op.create_table(
        "campaigns",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("platform_campaign_id", sa.String(255), nullable=False),
        sa.Column("name", sa.String(500), nullable=True),
        sa.Column("status", sa.String(50), nullable=True),
        sa.Column("objective", sa.String(100), nullable=True),
        sa.Column("budget_amount", sa.Numeric(15, 2), nullable=True),
        sa.Column("budget_type", sa.String(50), nullable=True),
        sa.Column("start_date", sa.DateTime(), nullable=True),
        sa.Column("end_date", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("platform", "platform_campaign_id", name="uq_platform_campaign"),
    )
    op.create_index("idx_campaigns_platform", "campaigns", ["platform"])
    op.create_index("idx_campaigns_status", "campaigns", ["status"])

    # Create campaign_metrics table (will be converted to hypertable)
    op.create_table(
        "campaign_metrics",
        sa.Column("time", sa.DateTime(), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("impressions", sa.BigInteger(), nullable=True),
        sa.Column("clicks", sa.BigInteger(), nullable=True),
        sa.Column("spend", sa.Numeric(15, 2), nullable=True),
        sa.Column("conversions", sa.BigInteger(), nullable=True),
        sa.Column("revenue", sa.Numeric(15, 2), nullable=True),
        sa.Column("cpc", sa.Numeric(10, 4), nullable=True),
        sa.Column("cpm", sa.Numeric(10, 4), nullable=True),
        sa.Column("ctr", sa.Numeric(5, 4), nullable=True),
        sa.Column("roas", sa.Numeric(10, 4), nullable=True),
        sa.Column("roi", sa.Numeric(10, 4), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"]),
        sa.PrimaryKeyConstraint("time", "campaign_id"),
    )

    # Convert to TimescaleDB hypertable
    op.execute("SELECT create_hypertable('campaign_metrics', 'time', if_not_exists => TRUE)")

    op.create_index("idx_campaign_metrics_campaign_id", "campaign_metrics", ["campaign_id"])

    # Create ai_recommendations table
    op.create_table(
        "ai_recommendations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("recommendation_type", sa.String(100), nullable=True),
        sa.Column("recommendation_text", sa.Text(), nullable=True),
        sa.Column("confidence_score", sa.Numeric(3, 2), nullable=True),
        sa.Column("status", sa.String(50), server_default="pending", nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
        sa.Column("executed_at", sa.DateTime(), nullable=True),
        sa.Column("result_metrics", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_ai_recommendations_status", "ai_recommendations", ["status"])
    op.create_index("idx_ai_recommendations_campaign", "ai_recommendations", ["campaign_id"])

    # Create ai_actions_log table
    op.create_table(
        "ai_actions_log",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("action_type", sa.String(100), nullable=False),
        sa.Column("platform", sa.String(50), nullable=True),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("previous_state", postgresql.JSONB(), nullable=True),
        sa.Column("new_state", postgresql.JSONB(), nullable=True),
        sa.Column("reasoning", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Numeric(3, 2), nullable=True),
        sa.Column("executed_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
        sa.Column("executed_by", sa.String(100), nullable=True),
        sa.Column("approval_required", sa.Boolean(), server_default="false", nullable=True),
        sa.Column("approved_by", sa.String(255), nullable=True),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_ai_actions_log_executed_at", "ai_actions_log", ["executed_at"])
    op.create_index("idx_ai_actions_log_platform", "ai_actions_log", ["platform"])

    # Create budget_allocations table
    op.create_table(
        "budget_allocations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("total_budget", sa.Numeric(15, 2), nullable=False),
        sa.Column("allocations", postgresql.JSONB(), nullable=True),
        sa.Column("ai_suggested", sa.Boolean(), server_default="false", nullable=True),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create alerts table
    op.create_table(
        "alerts",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("alert_type", sa.String(100), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("platform", sa.String(50), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("metric_name", sa.String(100), nullable=True),
        sa.Column("metric_value", sa.Numeric(15, 4), nullable=True),
        sa.Column("threshold_value", sa.Numeric(15, 4), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(), nullable=True),
        sa.Column("acknowledged_by", sa.String(255), nullable=True),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_alerts_severity", "alerts", ["severity"])
    op.create_index("idx_alerts_created_at", "alerts", ["created_at"])
    op.create_index(
        "idx_alerts_unresolved",
        "alerts",
        ["resolved_at"],
        postgresql_where=sa.text("resolved_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_table("alerts")
    op.drop_table("budget_allocations")
    op.drop_table("ai_actions_log")
    op.drop_table("ai_recommendations")
    op.drop_table("campaign_metrics")
    op.drop_table("campaigns")
