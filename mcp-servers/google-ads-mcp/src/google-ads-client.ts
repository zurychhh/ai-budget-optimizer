/**
 * Google Ads API Client
 *
 * Wrapper around google-ads-api library with typed responses.
 */

import { GoogleAdsApi, Customer } from 'google-ads-api';
import { googleAdsConfig, hasValidCredentials } from './config.js';

// Types for Google Ads responses
export interface GoogleAdsCampaign {
  campaign: {
    id: string;
    name: string;
    status: string;
  };
  campaign_budget: {
    id: string;
    amount_micros: string;
  };
  metrics: {
    impressions: string;
    clicks: string;
    cost_micros: string;
    conversions: string;
    conversions_value: string;
  };
}

export interface CampaignWithBudget {
  campaign: {
    id: string;
    name: string;
  };
  campaign_budget: {
    id: string;
    amount_micros: string;
  };
}

let client: GoogleAdsApi | null = null;
let customer: Customer | null = null;

/**
 * Initialize Google Ads client
 */
export function initializeClient(): void {
  if (!hasValidCredentials()) {
    console.error('[GoogleAds] Running in mock mode - credentials not configured');
    return;
  }

  try {
    client = new GoogleAdsApi({
      client_id: googleAdsConfig.clientId,
      client_secret: googleAdsConfig.clientSecret,
      developer_token: googleAdsConfig.developerToken,
    });

    customer = client.Customer({
      customer_id: googleAdsConfig.customerId,
      refresh_token: googleAdsConfig.refreshToken,
      login_customer_id: googleAdsConfig.loginCustomerId,
    });

    console.error('[GoogleAds] Client initialized successfully');
  } catch (error) {
    console.error('[GoogleAds] Failed to initialize client:', error);
    throw error;
  }
}

/**
 * Get Google Ads customer instance
 */
export function getCustomer(): Customer {
  if (!customer) {
    throw new Error('Google Ads client not initialized. Call initializeClient() first.');
  }
  return customer;
}

/**
 * Check if client is initialized and has valid credentials
 */
export function isClientReady(): boolean {
  return customer !== null && hasValidCredentials();
}

/**
 * Get campaign performance data
 */
export async function getCampaignPerformance(
  startDate: string,
  endDate: string,
  campaignIds?: string[]
): Promise<GoogleAdsCampaign[]> {
  if (!isClientReady()) {
    return getMockCampaignData();
  }

  const campaignFilter = campaignIds?.length
    ? `AND campaign.id IN (${campaignIds.join(',')})`
    : '';

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.id,
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
  `;

  const results = await getCustomer().query(query);
  return results as unknown as GoogleAdsCampaign[];
}

/**
 * Get campaign with budget info
 */
export async function getCampaignWithBudget(
  campaignId: string
): Promise<CampaignWithBudget | null> {
  if (!isClientReady()) {
    return {
      campaign: { id: campaignId, name: 'Mock Campaign' },
      campaign_budget: { id: 'mock-budget-123', amount_micros: '10000000000' },
    };
  }

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign_budget.id,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.id = ${campaignId}
  `;

  const results = await getCustomer().query(query);
  return results.length > 0 ? (results[0] as unknown as CampaignWithBudget) : null;
}

/**
 * Update campaign budget
 */
export async function updateBudget(
  budgetId: string,
  newBudgetMicros: number
): Promise<void> {
  if (!isClientReady()) {
    console.error(`[GoogleAds][MOCK] Would update budget ${budgetId} to ${newBudgetMicros} micros`);
    return;
  }

  // Use the report method for mutation (google-ads-api pattern)
  const mutation = {
    entity: 'campaign_budget',
    operation: 'update',
    resource: {
      resource_name: `customers/${googleAdsConfig.customerId}/campaignBudgets/${budgetId}`,
      amount_micros: newBudgetMicros,
    },
  };

  // Execute via query-based mutation
  await (getCustomer() as any).mutate(mutation);
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: string,
  status: 'ENABLED' | 'PAUSED'
): Promise<void> {
  if (!isClientReady()) {
    console.error(`[GoogleAds][MOCK] Would update campaign ${campaignId} status to ${status}`);
    return;
  }

  const mutation = {
    entity: 'campaign',
    operation: 'update',
    resource: {
      resource_name: `customers/${googleAdsConfig.customerId}/campaigns/${campaignId}`,
      status: status,
    },
  };

  await (getCustomer() as any).mutate(mutation);
}

/**
 * Mock data for development without credentials
 */
function getMockCampaignData(): GoogleAdsCampaign[] {
  return [
    {
      campaign: { id: '123456789', name: 'Brand Search Campaign', status: 'ENABLED' },
      campaign_budget: { id: 'budget-1', amount_micros: '50000000000' },
      metrics: {
        impressions: '125000',
        clicks: '4500',
        cost_micros: '4850000000',
        conversions: '145',
        conversions_value: '16900.00',
      },
    },
    {
      campaign: { id: '987654321', name: 'Display Remarketing', status: 'ENABLED' },
      campaign_budget: { id: 'budget-2', amount_micros: '30000000000' },
      metrics: {
        impressions: '450000',
        clicks: '2100',
        cost_micros: '2980000000',
        conversions: '89',
        conversions_value: '7450.00',
      },
    },
    {
      campaign: { id: '555555555', name: 'Performance Max', status: 'PAUSED' },
      campaign_budget: { id: 'budget-3', amount_micros: '20000000000' },
      metrics: {
        impressions: '280000',
        clicks: '3200',
        cost_micros: '1950000000',
        conversions: '112',
        conversions_value: '8775.00',
      },
    },
  ];
}
