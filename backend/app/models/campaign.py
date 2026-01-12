"""Campaign and metrics models"""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Campaign(Base):
    """Cross-platform campaign data"""

    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform = Column(String(50), nullable=False, index=True)
    platform_campaign_id = Column(String(255), nullable=False)
    name = Column(String(500))
    status = Column(String(50), index=True)
    objective = Column(String(100))
    budget_amount = Column(Numeric(15, 2))
    budget_type = Column(String(50))  # daily, lifetime
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    metrics = relationship("CampaignMetric", back_populates="campaign")
    recommendations = relationship("AIRecommendation", back_populates="campaign")
    actions = relationship("AIActionLog", back_populates="campaign")
    alerts = relationship("Alert", back_populates="campaign")

    __table_args__ = (
        UniqueConstraint("platform", "platform_campaign_id", name="uq_platform_campaign"),
    )

    def __repr__(self):
        return f"<Campaign {self.platform}:{self.name}>"


class CampaignMetric(Base):
    """
    Campaign metrics time-series data.

    This table is converted to a TimescaleDB hypertable for efficient
    time-series queries. Primary key is (time, campaign_id).
    """

    __tablename__ = "campaign_metrics"

    time = Column(DateTime, primary_key=True, nullable=False)
    campaign_id = Column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id"),
        primary_key=True,
        nullable=False,
    )
    impressions = Column(BigInteger)
    clicks = Column(BigInteger)
    spend = Column(Numeric(15, 2))
    conversions = Column(BigInteger)
    revenue = Column(Numeric(15, 2))
    cpc = Column(Numeric(10, 4))  # Cost per click
    cpm = Column(Numeric(10, 4))  # Cost per mille
    ctr = Column(Numeric(5, 4))  # Click-through rate
    roas = Column(Numeric(10, 4))  # Return on ad spend
    roi = Column(Numeric(10, 4))  # Return on investment

    # Relationship
    campaign = relationship("Campaign", back_populates="metrics")

    def __repr__(self):
        return f"<CampaignMetric {self.campaign_id} @ {self.time}>"
