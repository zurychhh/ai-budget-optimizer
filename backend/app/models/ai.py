"""AI recommendation and action log models"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class AIRecommendation(Base):
    """AI-generated optimization recommendations"""

    __tablename__ = "ai_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), index=True)
    recommendation_type = Column(String(100))  # PAUSE, INCREASE_BUDGET, DECREASE_BUDGET, REALLOCATE
    recommendation_text = Column(Text)
    confidence_score = Column(Numeric(3, 2))  # 0.00 to 1.00
    status = Column(
        String(50), default="pending", index=True
    )  # pending, accepted, rejected, executed
    created_at = Column(DateTime, default=datetime.utcnow)
    executed_at = Column(DateTime)
    result_metrics = Column(JSONB)  # Outcome after execution

    # Relationship
    campaign = relationship("Campaign", back_populates="recommendations")

    def __repr__(self):
        return f"<AIRecommendation {self.recommendation_type} conf={self.confidence_score}>"


class AIActionLog(Base):
    """Log of all AI-executed actions for audit trail"""

    __tablename__ = "ai_actions_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action_type = Column(String(100), nullable=False)  # PAUSE, BUDGET_CHANGE, REALLOCATE
    platform = Column(String(50), index=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), index=True)
    previous_state = Column(JSONB)  # State before action
    new_state = Column(JSONB)  # State after action
    reasoning = Column(Text)  # AI's explanation
    confidence = Column(Numeric(3, 2))
    executed_at = Column(DateTime, default=datetime.utcnow, index=True)
    executed_by = Column(String(100))  # 'ai_autonomous' or user_id
    approval_required = Column(Boolean, default=False)
    approved_by = Column(String(255))
    approved_at = Column(DateTime)

    # Relationship
    campaign = relationship("Campaign", back_populates="actions")

    def __repr__(self):
        return f"<AIActionLog {self.action_type} @ {self.executed_at}>"
