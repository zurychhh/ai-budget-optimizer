/**
 * Tests for Google Ads API Client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the google-ads-api module
vi.mock('google-ads-api', () => ({
  GoogleAdsApi: vi.fn().mockImplementation(() => ({
    Customer: vi.fn().mockReturnValue({
      query: vi.fn(),
      mutate: vi.fn(),
    }),
  })),
}));

// Mock config
vi.mock('../config.js', () => ({
  googleAdsConfig: {
    developerToken: 'test-token',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    refreshToken: 'test-refresh-token',
    customerId: '1234567890',
    loginCustomerId: undefined,
  },
  hasValidCredentials: vi.fn(() => true),
}));

describe('Google Ads Client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeClient', () => {
    it('should initialize client when credentials are valid', async () => {
      const { hasValidCredentials } = await import('../config.js');
      vi.mocked(hasValidCredentials).mockReturnValue(true);

      const { initializeClient, isClientReady } = await import('../google-ads-client.js');

      expect(() => initializeClient()).not.toThrow();
    });

    it('should not throw when credentials are invalid (mock mode)', async () => {
      vi.resetModules();
      vi.mock('../config.js', () => ({
        googleAdsConfig: {
          developerToken: 'PLACEHOLDER_TOKEN',
          clientId: '',
          clientSecret: '',
          refreshToken: '',
          customerId: '',
        },
        hasValidCredentials: vi.fn(() => false),
      }));

      const { initializeClient } = await import('../google-ads-client.js');
      expect(() => initializeClient()).not.toThrow();
    });
  });

  describe('isClientReady', () => {
    it('should return false before initialization', async () => {
      vi.resetModules();
      vi.mock('../config.js', () => ({
        googleAdsConfig: {
          developerToken: 'test',
          clientId: 'test',
          clientSecret: 'test',
          refreshToken: 'test',
          customerId: 'test',
        },
        hasValidCredentials: vi.fn(() => false),
      }));

      const { isClientReady } = await import('../google-ads-client.js');
      expect(isClientReady()).toBe(false);
    });
  });

  describe('getCampaignPerformance', () => {
    it('should return mock data when client is not ready', async () => {
      vi.resetModules();
      vi.mock('../config.js', () => ({
        googleAdsConfig: {
          developerToken: 'PLACEHOLDER',
          clientId: '',
          clientSecret: '',
          refreshToken: '',
          customerId: '',
        },
        hasValidCredentials: vi.fn(() => false),
      }));

      const { getCampaignPerformance } = await import('../google-ads-client.js');
      const result = await getCampaignPerformance('2024-01-01', '2024-01-31');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('campaign');
      expect(result[0]).toHaveProperty('campaign_budget');
      expect(result[0]).toHaveProperty('metrics');
    });

    it('should include required fields in mock data', async () => {
      vi.resetModules();
      vi.mock('../config.js', () => ({
        googleAdsConfig: {
          developerToken: 'PLACEHOLDER',
          clientId: '',
          clientSecret: '',
          refreshToken: '',
          customerId: '',
        },
        hasValidCredentials: vi.fn(() => false),
      }));

      const { getCampaignPerformance } = await import('../google-ads-client.js');
      const result = await getCampaignPerformance('2024-01-01', '2024-01-31');

      const campaign = result[0];
      expect(campaign.campaign).toHaveProperty('id');
      expect(campaign.campaign).toHaveProperty('name');
      expect(campaign.campaign).toHaveProperty('status');
      expect(campaign.campaign_budget).toHaveProperty('id');
      expect(campaign.campaign_budget).toHaveProperty('amount_micros');
      expect(campaign.metrics).toHaveProperty('impressions');
      expect(campaign.metrics).toHaveProperty('clicks');
      expect(campaign.metrics).toHaveProperty('cost_micros');
      expect(campaign.metrics).toHaveProperty('conversions');
      expect(campaign.metrics).toHaveProperty('conversions_value');
    });
  });

  describe('getCampaignWithBudget', () => {
    it('should return mock campaign when client is not ready', async () => {
      vi.resetModules();
      vi.mock('../config.js', () => ({
        googleAdsConfig: {
          developerToken: 'PLACEHOLDER',
          clientId: '',
          clientSecret: '',
          refreshToken: '',
          customerId: '',
        },
        hasValidCredentials: vi.fn(() => false),
      }));

      const { getCampaignWithBudget } = await import('../google-ads-client.js');
      const result = await getCampaignWithBudget('12345');

      expect(result).not.toBeNull();
      expect(result?.campaign.id).toBe('12345');
      expect(result?.campaign.name).toBe('Mock Campaign');
      expect(result?.campaign_budget.amount_micros).toBe('10000000000');
    });
  });

  describe('updateBudget', () => {
    it('should not throw in mock mode', async () => {
      vi.resetModules();
      vi.mock('../config.js', () => ({
        googleAdsConfig: {
          developerToken: 'PLACEHOLDER',
          clientId: '',
          clientSecret: '',
          refreshToken: '',
          customerId: '',
        },
        hasValidCredentials: vi.fn(() => false),
      }));

      const { updateBudget } = await import('../google-ads-client.js');
      await expect(updateBudget('budget-123', 50000000)).resolves.not.toThrow();
    });
  });

  describe('updateCampaignStatus', () => {
    it('should not throw when pausing in mock mode', async () => {
      vi.resetModules();
      vi.mock('../config.js', () => ({
        googleAdsConfig: {
          developerToken: 'PLACEHOLDER',
          clientId: '',
          clientSecret: '',
          refreshToken: '',
          customerId: '',
        },
        hasValidCredentials: vi.fn(() => false),
      }));

      const { updateCampaignStatus } = await import('../google-ads-client.js');
      await expect(updateCampaignStatus('campaign-123', 'PAUSED')).resolves.not.toThrow();
    });

    it('should not throw when enabling in mock mode', async () => {
      vi.resetModules();
      vi.mock('../config.js', () => ({
        googleAdsConfig: {
          developerToken: 'PLACEHOLDER',
          clientId: '',
          clientSecret: '',
          refreshToken: '',
          customerId: '',
        },
        hasValidCredentials: vi.fn(() => false),
      }));

      const { updateCampaignStatus } = await import('../google-ads-client.js');
      await expect(updateCampaignStatus('campaign-123', 'ENABLED')).resolves.not.toThrow();
    });
  });
});

describe('Mock Campaign Data Validation', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mock('../config.js', () => ({
      googleAdsConfig: {
        developerToken: 'PLACEHOLDER',
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        customerId: '',
      },
      hasValidCredentials: vi.fn(() => false),
    }));
  });

  it('should have realistic campaign statuses', async () => {
    const { getCampaignPerformance } = await import('../google-ads-client.js');
    const campaigns = await getCampaignPerformance('2024-01-01', '2024-01-31');

    const validStatuses = ['ENABLED', 'PAUSED', 'REMOVED'];
    campaigns.forEach((campaign) => {
      expect(validStatuses).toContain(campaign.campaign.status);
    });
  });

  it('should have positive metric values', async () => {
    const { getCampaignPerformance } = await import('../google-ads-client.js');
    const campaigns = await getCampaignPerformance('2024-01-01', '2024-01-31');

    campaigns.forEach((campaign) => {
      expect(parseInt(campaign.metrics.impressions)).toBeGreaterThan(0);
      expect(parseInt(campaign.metrics.clicks)).toBeGreaterThan(0);
      expect(parseInt(campaign.metrics.cost_micros)).toBeGreaterThan(0);
    });
  });

  it('should have budget in micros format (>= 1M)', async () => {
    const { getCampaignPerformance } = await import('../google-ads-client.js');
    const campaigns = await getCampaignPerformance('2024-01-01', '2024-01-31');

    campaigns.forEach((campaign) => {
      const budgetMicros = parseInt(campaign.campaign_budget.amount_micros);
      // At least $1 = 1,000,000 micros
      expect(budgetMicros).toBeGreaterThanOrEqual(1000000);
    });
  });

  it('should have unique campaign IDs', async () => {
    const { getCampaignPerformance } = await import('../google-ads-client.js');
    const campaigns = await getCampaignPerformance('2024-01-01', '2024-01-31');

    const ids = campaigns.map((c) => c.campaign.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
