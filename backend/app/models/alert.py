"""Alert models for monitoring and notifications"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Alert(Base):
    """System alerts for anomalies and important events"""

    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_type = Column(String(100), nullable=False)  # ROAS_DROP, CPA_SPIKE, ZERO_CONVERSIONS
    severity = Column(String(20), nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), index=True)
    platform = Column(String(50))
    message = Column(Text)
    metric_name = Column(String(100))
    metric_value = Column(Numeric(15, 4))
    threshold_value = Column(Numeric(15, 4))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    acknowledged_at = Column(DateTime)
    acknowledged_by = Column(String(255))
    resolved_at = Column(DateTime)

    # Relationship
    campaign = relationship("Campaign", back_populates="alerts")

    def __repr__(self):
        return f"<Alert {self.severity}:{self.alert_type}>"
