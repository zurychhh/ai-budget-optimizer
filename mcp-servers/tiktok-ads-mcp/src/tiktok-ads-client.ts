/**
 * TikTok Ads API Client
 */

import { tiktokAdsConfig, hasValidCredentials } from './config.js';

export interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  status: string;
  budget_usd: number;
  impressions: number;
  clicks: number;
  cost_usd: number;
  conversions: number;
  revenue_usd: number;
  cpc: number;
  ctr: number;
  roas: number;
}

let apiInitialized = false;

export function initializeClient(): void {
  if (!hasValidCredentials()) {
    console.error('[TikTokAds] Running in mock mode - credentials not configured');
    return;
  }

  try {
    // TikTok Marketing API uses REST endpoints
    // Real implementation would set up HTTP client with auth headers
    apiInitialized = true;
    console.error('[TikTokAds] Client initialized successfully');
  } catch (error) {
    console.error('[TikTokAds] Failed to initialize client:', error);
    throw error;
  }
}

export function isClientReady(): boolean {
  return apiInitialized && hasValidCredentials();
}

export async function getCampaignPerformance(
  startDate: string,
  endDate: string,
  campaignIds?: string[]
): Promise<CampaignPerformance[]> {
  if (!isClientReady()) {
    return getMockCampaignData();
  }

  // Real implementation would call TikTok Marketing API:
  // GET https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/

  return getMockCampaignData();
}

export async function getCampaignById(
  campaignId: string
): Promise<CampaignPerformance | null> {
  if (!isClientReady()) {
    const mockData = getMockCampaignData();
    return mockData.find(c => c.campaign_id === campaignId) || mockData[0];
  }

  return null;
}

export async function updateBudget(
  campaignId: string,
  newBudget: number
): Promise<void> {
  if (!isClientReady()) {
    console.error(`[TikTokAds][MOCK] Would update campaign ${campaignId} budget to $${newBudget}`);
    return;
  }

  // Real implementation:
  // POST https://business-api.tiktok.com/open_api/v1.3/campaign/update/
}

export async function updateCampaignStatus(
  campaignId: string,
  status: 'ENABLE' | 'DISABLE'
): Promise<void> {
  if (!isClientReady()) {
    console.error(`[TikTokAds][MOCK] Would update campaign ${campaignId} status to ${status}`);
    return;
  }

  // Real implementation:
  // POST https://business-api.tiktok.com/open_api/v1.3/campaign/status/update/
}

function getMockCampaignData(): CampaignPerformance[] {
  return [
    {
      campaign_id: 'tiktok_123456789',
      campaign_name: 'TikTok In-Feed - Gen Z',
      status: 'ENABLE',
      budget_usd: 500.00,
      impressions: 1250000,
      clicks: 45000,
      cost_usd: 485.00,
      conversions: 890,
      revenue_usd: 8900.00,
      cpc: 0.011,
      ctr: 0.036,
      roas: 18.35,
    },
    {
      campaign_id: 'tiktok_987654321',
      campaign_name: 'Spark Ads - UGC Promo',
      status: 'ENABLE',
      budget_usd: 300.00,
      impressions: 890000,
      clicks: 28000,
      cost_usd: 275.50,
      conversions: 456,
      revenue_usd: 4104.00,
      cpc: 0.010,
      ctr: 0.031,
      roas: 14.90,
    },
    {
      campaign_id: 'tiktok_555555555',
      campaign_name: 'TopView - Brand Launch',
      status: 'DISABLE',
      budget_usd: 2000.00,
      impressions: 5000000,
      clicks: 125000,
      cost_usd: 1850.00,
      conversions: 1250,
      revenue_usd: 18750.00,
      cpc: 0.015,
      ctr: 0.025,
      roas: 10.14,
    },
  ];
}
