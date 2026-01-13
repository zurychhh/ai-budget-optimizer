/**
 * Tests for Meta Ads API Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock config
vi.mock('../config.js', () => ({
  metaAdsConfig: {
    accessToken: 'test-token',
    adAccountId: '123456789',
    appId: 'app-id',
    appSecret: 'app-secret',
  },
  serverConfig: { name: 'meta-ads-mcp', version: '1.0.0', port: 3002 },
  hasValidCredentials: vi.fn(() => false),
}));

describe('Meta Ads Client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe('initializeClient', () => {
    it('should not throw when credentials are invalid (mock mode)', async () => {
      const { hasValidCredentials } = await import('../config.js');
      vi.mocked(hasValidCredentials).mockReturnValue(false);

      const { initializeClient } = await import('../meta-ads-client.js');
      expect(() => initializeClient()).not.toThrow();
    });

    it('should initialize successfully with valid credentials', async () => {
      vi.resetModules();
      vi.mock('../config.js', () => ({
        metaAdsConfig: {
          accessToken: 'valid-token',
          adAccountId: '123456789',
          appId: 'app-id',
          appSecret: 'app-secret',
        },
        hasValidCredentials: vi.fn(() => true),
      }));

      const { initializeClient } = await import('../meta-ads-client.js');
      expect(() => initializeClient()).not.toThrow();
    });
  });

  describe('isClientReady', () => {
    it('should return false when not initialized', async () => {
      const { isClientReady } = await import('../meta-ads-client.js');
      expect(isClientReady()).toBe(false);
    });
  });

  describe('getCampaignPerformance', () => {
    it('should return mock data when client is not ready', async () => {
      const { getCampaignPerformance } = await import('../meta-ads-client.js');
      const result = await getCampaignPerformance('2024-01-01', '2024-01-31');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include required performance fields', async () => {
      const { getCampaignPerformance } = await import('../meta-ads-client.js');
      const result = await getCampaignPerformance('2024-01-01', '2024-01-31');

      const campaign = result[0];
      expect(campaign).toHaveProperty('campaign_id');
      expect(campaign).toHaveProperty('campaign_name');
      expect(campaign).toHaveProperty('status');
      expect(campaign).toHaveProperty('budget_usd');
      expect(campaign).toHaveProperty('impressions');
      expect(campaign).toHaveProperty('clicks');
      expect(campaign).toHaveProperty('cost_usd');
      expect(campaign).toHaveProperty('conversions');
      expect(campaign).toHaveProperty('revenue_usd');
      expect(campaign).toHaveProperty('cpc');
      expect(campaign).toHaveProperty('ctr');
      expect(campaign).toHaveProperty('roas');
    });

    it('should have valid status values', async () => {
      const { getCampaignPerformance } = await import('../meta-ads-client.js');
      const result = await getCampaignPerformance('2024-01-01', '2024-01-31');

      const validStatuses = ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'];
      result.forEach((campaign) => {
        expect(validStatuses).toContain(campaign.status);
      });
    });
  });

  describe('getCampaignById', () => {
    it('should return campaign when found', async () => {
      const { getCampaignById } = await import('../meta-ads-client.js');
      const result = await getCampaignById('meta_123456789');

      expect(result).not.toBeNull();
    });

    it('should return fallback when campaign not found', async () => {
      const { getCampaignById } = await import('../meta-ads-client.js');
      const result = await getCampaignById('nonexistent_id');

      // In mock mode, returns first mock campaign as fallback
      expect(result).not.toBeNull();
    });
  });

  describe('updateBudget', () => {
    it('should not throw in mock mode', async () => {
      const { updateBudget } = await import('../meta-ads-client.js');
      await expect(updateBudget('campaign-123', 100)).resolves.not.toThrow();
    });
  });

  describe('updateCampaignStatus', () => {
    it('should not throw when pausing', async () => {
      const { updateCampaignStatus } = await import('../meta-ads-client.js');
      await expect(updateCampaignStatus('campaign-123', 'PAUSED')).resolves.not.toThrow();
    });

    it('should not throw when activating', async () => {
      const { updateCampaignStatus } = await import('../meta-ads-client.js');
      await expect(updateCampaignStatus('campaign-123', 'ACTIVE')).resolves.not.toThrow();
    });
  });
});

describe('Mock Campaign Data Validation', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mock('../config.js', () => ({
      metaAdsConfig: {
        accessToken: '',
        adAccountId: '',
        appId: '',
        appSecret: '',
      },
      hasValidCredentials: vi.fn(() => false),
    }));
  });

  it('should have positive budget values', async () => {
    const { getCampaignPerformance } = await import('../meta-ads-client.js');
    const campaigns = await getCampaignPerformance('2024-01-01', '2024-01-31');

    campaigns.forEach((campaign) => {
      expect(campaign.budget_usd).toBeGreaterThan(0);
    });
  });

  it('should have positive metric values', async () => {
    const { getCampaignPerformance } = await import('../meta-ads-client.js');
    const campaigns = await getCampaignPerformance('2024-01-01', '2024-01-31');

    campaigns.forEach((campaign) => {
      expect(campaign.impressions).toBeGreaterThan(0);
      expect(campaign.clicks).toBeGreaterThan(0);
      expect(campaign.cost_usd).toBeGreaterThan(0);
    });
  });

  it('should have unique campaign IDs', async () => {
    const { getCampaignPerformance } = await import('../meta-ads-client.js');
    const campaigns = await getCampaignPerformance('2024-01-01', '2024-01-31');

    const ids = campaigns.map((c) => c.campaign_id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have realistic ROAS values', async () => {
    const { getCampaignPerformance } = await import('../meta-ads-client.js');
    const campaigns = await getCampaignPerformance('2024-01-01', '2024-01-31');

    campaigns.forEach((campaign) => {
      // ROAS should be between 0 and 100 (realistic range)
      expect(campaign.roas).toBeGreaterThanOrEqual(0);
      expect(campaign.roas).toBeLessThan(100);
    });
  });

  it('should have CTR less than 1 (100%)', async () => {
    const { getCampaignPerformance } = await import('../meta-ads-client.js');
    const campaigns = await getCampaignPerformance('2024-01-01', '2024-01-31');

    campaigns.forEach((campaign) => {
      expect(campaign.ctr).toBeLessThan(1);
      expect(campaign.ctr).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have campaign IDs prefixed with meta_', async () => {
    const { getCampaignPerformance } = await import('../meta-ads-client.js');
    const campaigns = await getCampaignPerformance('2024-01-01', '2024-01-31');

    campaigns.forEach((campaign) => {
      expect(campaign.campaign_id).toMatch(/^meta_/);
    });
  });
});
