// Platform types
export type Platform = 'google_ads' | 'meta_ads' | 'tiktok_ads' | 'linkedin_ads';

export type CampaignStatus = 'ENABLED' | 'PAUSED' | 'REMOVED';

export interface Campaign {
  campaign_id: string;
  campaign_name: string;
  platform: Platform;
  status: CampaignStatus;
  budget_usd: number;
  cost_usd: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue_usd: number;
  roas: number;
  cpc: number;
  ctr: number;
}

// AI types
export type HealthStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionType = 'budget_increase' | 'budget_decrease' | 'pause_campaign' | 'resume_campaign' | 'reallocate_budget';

export interface PerformanceAnalysis {
  overall_health: HealthStatus;
  health_score: number;
  summary: string;
  top_performers: TopPerformer[];
  underperformers: Underperformer[];
  trends: Trend[];
  recommendations: Recommendation[];
  analyzed_at: string;
  campaign_count: number;
}

export interface TopPerformer {
  campaign_id: string;
  platform: Platform;
  roas: number;
  reason: string;
}

export interface Underperformer {
  campaign_id: string;
  platform: Platform;
  issue: string;
  severity: Severity;
}

export interface Trend {
  type: string;
  description: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface Recommendation {
  id: string;
  action_type: ActionType;
  campaign_id: string;
  platform: Platform;
  description: string;
  reasoning: string;
  confidence: number;
  estimated_impact: {
    metric: string;
    change_percent: number;
  };
  priority: Priority;
  auto_execute?: boolean;
  requires_approval?: boolean;
}

export interface Anomaly {
  id: string;
  campaign_id: string;
  platform: Platform;
  metric: string;
  anomaly_type: 'SPIKE' | 'DROP' | 'TREND_CHANGE' | 'PACING_ISSUE';
  severity: Severity;
  current_value: number;
  expected_value: number;
  deviation_percent: number;
  description: string;
  possible_causes: string[];
  recommended_action: string;
  auto_actionable: boolean;
  urgency_hours: number;
}

export interface AnomalyDetection {
  anomalies: Anomaly[];
  overall_status: 'NORMAL' | 'MONITORING' | 'ATTENTION_NEEDED' | 'ACTION_REQUIRED' | 'CRITICAL';
  summary: string;
  healthy_campaigns: number;
  anomalous_campaigns: number;
  checked_at: string;
}

export interface BudgetRecommendation {
  campaign_id: string;
  campaign_name: string;
  platform: Platform;
  current_budget: number;
  recommended_budget: number;
  change_amount: number;
  change_percent: number;
  reasoning: string;
  confidence: number;
  expected_roas_impact: number;
}

export interface BudgetOptimization {
  current_metrics: {
    total_spend: number;
    total_revenue: number;
    overall_roas: number;
    total_conversions: number;
  };
  recommendations: BudgetRecommendation[];
  projected_improvement: {
    new_overall_roas: number;
    roas_improvement_percent: number;
    additional_revenue: number;
    additional_conversions: number;
  };
  risks: string[];
  execution_order: string[];
  generated_at: string;
  total_budget: number;
  optimization_goal: string;
}

export interface ActionPlan {
  action_plan: Recommendation[];
  summary: {
    total_actions: number;
    auto_executable: number;
    requires_approval: number;
    estimated_budget_impact: number;
    estimated_roas_improvement: number;
  };
  execution_window: string;
  next_review: string;
  generated_at: string;
  automation_level: string;
}

// Alert types
export interface Alert {
  id: string;
  type: string;
  severity: Severity;
  campaign_id: string;
  platform: Platform;
  message: string;
  created_at: string;
  acknowledged: boolean;
}

// Dashboard types
export interface DashboardMetrics {
  total_spend: number;
  total_revenue: number;
  total_conversions: number;
  overall_roas: number;
  active_campaigns: number;
  platforms_connected: number;
}

export interface PlatformMetrics {
  platform: Platform;
  campaigns: number;
  spend: number;
  revenue: number;
  roas: number;
  status: 'connected' | 'error' | 'disconnected';
}
