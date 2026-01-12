"""Budget allocation models"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.core.database import Base


class BudgetAllocation(Base):
    """Budget distribution across platforms and campaigns"""

    __tablename__ = "budget_allocations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    total_budget = Column(Numeric(15, 2), nullable=False)
    allocations = Column(JSONB)  # {"google_ads": 5000, "meta_ads": 3000, ...}
    ai_suggested = Column(Boolean, default=False)
    created_by = Column(String(255))  # user_id or 'ai_autonomous'
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<BudgetAllocation {self.period_start} to {self.period_end}>"
