import axios from 'axios';
import type {
  Campaign,
  PerformanceAnalysis,
  BudgetOptimization,
  AnomalyDetection,
  ActionPlan,
  Recommendation,
  DashboardMetrics,
  PlatformMetrics,
  Platform,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get dates for last 7 days
function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  };
}

// Campaign API - aligned with backend routes
export async function getCampaigns(platform?: Platform): Promise<Campaign[]> {
  const { start_date, end_date } = getDefaultDateRange();
  const params: Record<string, string> = { start_date, end_date };
  if (platform) {
    params.platforms = platform;
  }
  const response = await api.get('/campaigns/performance', { params });
  return response.data.campaigns;
}

export async function getCampaignPerformance(
  platform: Platform,
  startDate: string,
  endDate: string
): Promise<{ campaigns: Campaign[]; count: number }> {
  const response = await api.get(`/campaigns/${platform}/performance`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return response.data;
}

export async function pauseCampaign(
  platform: Platform,
  campaignId: string
): Promise<{ success: boolean }> {
  const response = await api.post(`/campaigns/${campaignId}/pause`, null, {
    params: { platform },
  });
  return response.data;
}

export async function resumeCampaign(
  platform: Platform,
  campaignId: string
): Promise<{ success: boolean }> {
  const response = await api.post(`/campaigns/${campaignId}/resume`, null, {
    params: { platform },
  });
  return response.data;
}

export async function updateBudget(
  platform: Platform,
  campaignId: string,
  newBudget: number
): Promise<{ success: boolean }> {
  const response = await api.put(`/campaigns/${campaignId}/budget`,
    { new_budget: newBudget },
    { params: { platform } }
  );
  return response.data;
}

// AI API - aligned with backend expectations
export async function analyzePerformance(): Promise<PerformanceAnalysis> {
  const { start_date, end_date } = getDefaultDateRange();
  const response = await api.post('/ai/analyze', {
    start_date,
    end_date,
    platforms: null, // null = all platforms
  });
  return response.data;
}

export async function optimizeBudget(
  totalBudget: number,
  optimizationGoal: string = 'maximize_roas'
): Promise<BudgetOptimization> {
  const response = await api.post('/ai/optimize-budget', {
    total_budget: totalBudget,
    optimization_goal: optimizationGoal,
    max_change_percent: 30.0,
    platforms: null,
  });
  return response.data;
}

export async function detectAnomalies(): Promise<AnomalyDetection> {
  const response = await api.post('/ai/detect-anomalies', {
    platforms: null,
    lookback_days: 7,
  });
  return response.data;
}

export async function getActionPlan(): Promise<ActionPlan> {
  const response = await api.post('/ai/action-plan');
  return response.data;
}

export async function askAI(query: string): Promise<{ response: string }> {
  const response = await api.post('/ai/query', { query });
  return response.data;
}

export async function getRecommendations(): Promise<Recommendation[]> {
  const response = await api.get('/ai/recommendations');
  return response.data.recommendations;
}

export async function acceptRecommendation(
  recommendationId: string
): Promise<{ status: string }> {
  const response = await api.post(`/ai/recommendations/${recommendationId}/accept`);
  return response.data;
}

export async function rejectRecommendation(
  recommendationId: string,
  reason?: string
): Promise<{ status: string }> {
  const response = await api.post(`/ai/recommendations/${recommendationId}/reject`, { reason });
  return response.data;
}

export async function getAIStatus(): Promise<{
  engine_status: string;
  automation_level: string;
  last_analysis: string | null;
  pending_recommendations: number;
}> {
  const response = await api.get('/ai/status');
  return response.data;
}

// Dashboard API
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await api.get('/dashboard/metrics');
  return response.data;
}

export async function getPlatformMetrics(): Promise<PlatformMetrics[]> {
  const response = await api.get('/dashboard/platforms');
  return response.data.platforms;
}

// Health check
export async function healthCheck(): Promise<{ status: string }> {
  const response = await api.get('/health');
  return response.data;
}

export default api;
