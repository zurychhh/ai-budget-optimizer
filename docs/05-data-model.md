# Data Model

## Database Schema

### Campaigns Table

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL,
    platform_campaign_id VARCHAR(255) NOT NULL,
    name VARCHAR(500),
    status VARCHAR(50),
    objective VARCHAR(100),
    budget_amount DECIMAL(15,2),
    budget_type VARCHAR(50), -- daily, lifetime
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, platform_campaign_id)
);
```

### Campaign Metrics (TimescaleDB Hypertable)

```sql
CREATE TABLE campaign_metrics (
    time TIMESTAMP NOT NULL,
    campaign_id UUID REFERENCES campaigns(id),
    impressions BIGINT,
    clicks BIGINT,
    spend DECIMAL(15,2),
    conversions INTEGER,
    revenue DECIMAL(15,2),
    cpc DECIMAL(10,4),
    cpm DECIMAL(10,4),
    ctr DECIMAL(5,4),
    roas DECIMAL(10,4),
    roi DECIMAL(10,4),
    PRIMARY KEY (time, campaign_id)
);

SELECT create_hypertable('campaign_metrics', 'time');
```

### AI Recommendations

```sql
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    recommendation_type VARCHAR(100),
    recommendation_text TEXT,
    confidence_score DECIMAL(3,2),
    status VARCHAR(50), -- pending, accepted, rejected, executed
    created_at TIMESTAMP DEFAULT NOW(),
    executed_at TIMESTAMP,
    result_metrics JSONB
);
```

### Budget Allocations

```sql
CREATE TABLE budget_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start DATE,
    period_end DATE,
    total_budget DECIMAL(15,2),
    allocations JSONB, -- {"google": 5000, "meta": 3000, ...}
    ai_suggested BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### AI Actions Log

```sql
CREATE TABLE ai_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(100), -- PAUSE, BUDGET_CHANGE, REALLOCATE
    platform VARCHAR(50),
    campaign_id UUID REFERENCES campaigns(id),
    previous_state JSONB,
    new_state JSONB,
    reasoning TEXT,
    confidence DECIMAL(3,2),
    executed_at TIMESTAMP DEFAULT NOW(),
    executed_by VARCHAR(100), -- 'ai_autonomous' or user_id
    approval_required BOOLEAN DEFAULT false,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP
);
```

### Alerts

```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(100), -- ROAS_DROP, CPA_SPIKE, ZERO_CONVERSIONS
    severity VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    campaign_id UUID REFERENCES campaigns(id),
    platform VARCHAR(50),
    message TEXT,
    metric_name VARCHAR(100),
    metric_value DECIMAL(15,4),
    threshold_value DECIMAL(15,4),
    created_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(255),
    resolved_at TIMESTAMP
);
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  REAL-TIME DATA FLOW                                        │
│                                                             │
│  Platforms → API Connectors → ETL Pipeline → PostgreSQL     │
│      ↓            ↓               ↓              ↓          │
│   15min         Raw Data      Normalized    TimescaleDB     │
│   sync                         Metrics                      │
│                                   ↓                         │
│                          Redis Cache (Real-time)            │
│                                   ↓                         │
│                          Analytics Engine                   │
│                                   ↓                         │
│                          AI Analysis (Claude)               │
│                                   ↓                         │
│                          Recommendations                    │
└─────────────────────────────────────────────────────────────┘
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_campaigns_platform ON campaigns(platform);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX idx_campaign_metrics_time ON campaign_metrics(time DESC);

-- AI recommendations indexes
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_campaign ON ai_recommendations(campaign_id);

-- Actions log indexes
CREATE INDEX idx_ai_actions_log_executed_at ON ai_actions_log(executed_at DESC);
CREATE INDEX idx_ai_actions_log_platform ON ai_actions_log(platform);

-- Alerts indexes
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_unresolved ON alerts(resolved_at) WHERE resolved_at IS NULL;
```

## Sample Queries

### Get campaign performance (last 7 days)
```sql
SELECT
    c.name,
    c.platform,
    SUM(m.spend) as total_spend,
    SUM(m.revenue) as total_revenue,
    SUM(m.revenue) / NULLIF(SUM(m.spend), 0) as roas,
    SUM(m.conversions) as total_conversions,
    SUM(m.spend) / NULLIF(SUM(m.conversions), 0) as cpa
FROM campaigns c
JOIN campaign_metrics m ON c.id = m.campaign_id
WHERE m.time >= NOW() - INTERVAL '7 days'
GROUP BY c.id, c.name, c.platform
ORDER BY roas DESC;
```

### Get pending AI recommendations
```sql
SELECT
    r.*,
    c.name as campaign_name,
    c.platform
FROM ai_recommendations r
JOIN campaigns c ON r.campaign_id = c.id
WHERE r.status = 'pending'
ORDER BY r.confidence_score DESC, r.created_at ASC;
```

### Get AI actions history
```sql
SELECT
    a.*,
    c.name as campaign_name
FROM ai_actions_log a
LEFT JOIN campaigns c ON a.campaign_id = c.id
WHERE a.executed_at >= NOW() - INTERVAL '24 hours'
ORDER BY a.executed_at DESC;
```

### Get active alerts
```sql
SELECT
    a.*,
    c.name as campaign_name
FROM alerts a
LEFT JOIN campaigns c ON a.campaign_id = c.id
WHERE a.resolved_at IS NULL
ORDER BY
    CASE a.severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END,
    a.created_at DESC;
```

## Related Documents

- [Architecture](./02-architecture.md) - System architecture
- [Deployment](./08-deployment.md) - Database setup
