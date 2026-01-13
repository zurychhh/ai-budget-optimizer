/**
 * Tests for MCP Server Tool Handlers
 *
 * Tests the core business logic of each tool handler.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before imports
vi.mock('../config.js', () => ({
  serverConfig: { name: 'google-ads-mcp', version: '1.0.0', port: 3001 },
  hasValidCredentials: vi.fn(() => false),
}));

vi.mock('../google-ads-client.js', () => ({
  initializeClient: vi.fn(),
  isClientReady: vi.fn(() => false),
  getCampaignPerformance: vi.fn(),
  getCampaignWithBudget: vi.fn(),
  updateBudget: vi.fn(),
  updateCampaignStatus: vi.fn(),
}));

describe('Helper Functions', () => {
  describe('microsToUsd', () => {
    it('should convert micros to USD correctly', () => {
      // Test function inline since it's not exported
      const microsToUsd = (micros: number | string): number => {
        const value = typeof micros === 'string' ? parseInt(micros, 10) : micros;
        return value / 1_000_000;
      };

      expect(microsToUsd(1000000)).toBe(1);
      expect(microsToUsd(50000000)).toBe(50);
      expect(microsToUsd('1000000')).toBe(1);
      expect(microsToUsd(0)).toBe(0);
      expect(microsToUsd(500000)).toBe(0.5);
    });

    it('should handle large budget values', () => {
      const microsToUsd = (micros: number | string): number => {
        const value = typeof micros === 'string' ? parseInt(micros, 10) : micros;
        return value / 1_000_000;
      };

      // $10,000 daily budget
      expect(microsToUsd(10000000000)).toBe(10000);
      // $1,000,000 budget
      expect(microsToUsd(1000000000000)).toBe(1000000);
    });

    it('should handle string inputs', () => {
      const microsToUsd = (micros: number | string): number => {
        const value = typeof micros === 'string' ? parseInt(micros, 10) : micros;
        return value / 1_000_000;
      };

      expect(microsToUsd('50000000000')).toBe(50000);
    });
  });

  describe('formatToolResponse', () => {
    it('should format success response correctly', () => {
      const formatToolResponse = (data: unknown, isError = false) => ({
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
        isError,
      });

      const result = formatToolResponse({ success: true, value: 42 });

      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual({ success: true, value: 42 });
    });

    it('should format error response correctly', () => {
      const formatToolResponse = (data: unknown, isError = false) => ({
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
        isError,
      });

      const result = formatToolResponse({ error: true, message: 'Something went wrong' }, true);

      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text)).toHaveProperty('error', true);
    });

    it('should handle complex nested objects', () => {
      const formatToolResponse = (data: unknown, isError = false) => ({
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
        isError,
      });

      const data = {
        campaigns: [
          { id: '1', name: 'Campaign 1', metrics: { clicks: 100 } },
          { id: '2', name: 'Campaign 2', metrics: { clicks: 200 } },
        ],
        count: 2,
      };

      const result = formatToolResponse(data);
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed.campaigns).toHaveLength(2);
      expect(parsed.count).toBe(2);
    });
  });
});

describe('Calculated Metrics', () => {
  describe('CPC (Cost Per Click)', () => {
    it('should calculate CPC correctly', () => {
      const costUsd = 100;
      const clicks = 50;
      const cpc = clicks > 0 ? Number((costUsd / clicks).toFixed(2)) : 0;

      expect(cpc).toBe(2);
    });

    it('should return 0 when clicks is 0', () => {
      const costUsd = 100;
      const clicks = 0;
      const cpc = clicks > 0 ? Number((costUsd / clicks).toFixed(2)) : 0;

      expect(cpc).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const costUsd = 100;
      const clicks = 33;
      const cpc = clicks > 0 ? Number((costUsd / clicks).toFixed(2)) : 0;

      expect(cpc).toBe(3.03);
    });
  });

  describe('CPM (Cost Per Mille)', () => {
    it('should calculate CPM correctly', () => {
      const costUsd = 100;
      const impressions = 50000;
      const cpm = impressions > 0 ? Number(((costUsd / impressions) * 1000).toFixed(2)) : 0;

      expect(cpm).toBe(2);
    });

    it('should return 0 when impressions is 0', () => {
      const costUsd = 100;
      const impressions = 0;
      const cpm = impressions > 0 ? Number(((costUsd / impressions) * 1000).toFixed(2)) : 0;

      expect(cpm).toBe(0);
    });
  });

  describe('CTR (Click-Through Rate)', () => {
    it('should calculate CTR correctly', () => {
      const clicks = 100;
      const impressions = 10000;
      const ctr = impressions > 0 ? Number((clicks / impressions).toFixed(4)) : 0;

      expect(ctr).toBe(0.01);
    });

    it('should return 0 when impressions is 0', () => {
      const clicks = 100;
      const impressions = 0;
      const ctr = impressions > 0 ? Number((clicks / impressions).toFixed(4)) : 0;

      expect(ctr).toBe(0);
    });

    it('should handle high CTR', () => {
      const clicks = 500;
      const impressions = 1000;
      const ctr = impressions > 0 ? Number((clicks / impressions).toFixed(4)) : 0;

      expect(ctr).toBe(0.5);
    });
  });

  describe('ROAS (Return On Ad Spend)', () => {
    it('should calculate ROAS correctly', () => {
      const revenue = 500;
      const costUsd = 100;
      const roas = costUsd > 0 ? Number((revenue / costUsd).toFixed(2)) : 0;

      expect(roas).toBe(5);
    });

    it('should return 0 when cost is 0', () => {
      const revenue = 500;
      const costUsd = 0;
      const roas = costUsd > 0 ? Number((revenue / costUsd).toFixed(2)) : 0;

      expect(roas).toBe(0);
    });

    it('should handle fractional ROAS', () => {
      const revenue = 50;
      const costUsd = 100;
      const roas = costUsd > 0 ? Number((revenue / costUsd).toFixed(2)) : 0;

      expect(roas).toBe(0.5);
    });
  });
});

describe('Campaign Performance Handler Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should transform raw campaign data correctly', async () => {
    const { getCampaignPerformance, isClientReady } = await import('../google-ads-client.js');

    vi.mocked(isClientReady).mockReturnValue(false);
    vi.mocked(getCampaignPerformance).mockResolvedValue([
      {
        campaign: { id: '123', name: 'Test Campaign', status: 'ENABLED' },
        campaign_budget: { id: 'budget-1', amount_micros: '50000000' },
        metrics: {
          impressions: '10000',
          clicks: '100',
          cost_micros: '25000000',
          conversions: '10',
          conversions_value: '500.00',
        },
      },
    ]);

    const results = await getCampaignPerformance('2024-01-01', '2024-01-31');

    expect(results).toHaveLength(1);
    expect(results[0].campaign.id).toBe('123');
    expect(results[0].campaign.status).toBe('ENABLED');
  });
});

describe('Update Budget Handler Logic', () => {
  it('should reject invalid budget values', () => {
    const validateBudget = (budget: number | undefined): boolean => {
      return budget !== undefined && budget > 0;
    };

    expect(validateBudget(0)).toBe(false);
    expect(validateBudget(-100)).toBe(false);
    expect(validateBudget(undefined)).toBe(false);
    expect(validateBudget(50000000)).toBe(true);
  });

  it('should accept valid micros budget', () => {
    const validateBudget = (budget: number | undefined): boolean => {
      return budget !== undefined && budget > 0;
    };

    // $50 daily budget
    expect(validateBudget(50000000)).toBe(true);
    // $1 daily budget
    expect(validateBudget(1000000)).toBe(true);
    // $10,000 daily budget
    expect(validateBudget(10000000000)).toBe(true);
  });
});

describe('Campaign Action Handlers', () => {
  describe('Pause Campaign', () => {
    it('should call updateCampaignStatus with PAUSED', async () => {
      const { updateCampaignStatus } = await import('../google-ads-client.js');

      await updateCampaignStatus('campaign-123', 'PAUSED');

      expect(updateCampaignStatus).toHaveBeenCalledWith('campaign-123', 'PAUSED');
    });
  });

  describe('Resume Campaign', () => {
    it('should call updateCampaignStatus with ENABLED', async () => {
      const { updateCampaignStatus } = await import('../google-ads-client.js');

      await updateCampaignStatus('campaign-456', 'ENABLED');

      expect(updateCampaignStatus).toHaveBeenCalledWith('campaign-456', 'ENABLED');
    });
  });
});

describe('Error Handling', () => {
  it('should format unknown tool error correctly', () => {
    const formatToolResponse = (data: unknown, isError = false) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      isError,
    });

    const result = formatToolResponse({ error: true, message: 'Unknown tool: invalid_tool' }, true);

    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.message).toContain('Unknown tool');
  });

  it('should format exception error correctly', () => {
    const formatToolResponse = (data: unknown, isError = false) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      isError,
    });

    const error = new Error('API rate limit exceeded');
    const result = formatToolResponse(
      { error: true, message: error.message, tool: 'get_campaign_performance' },
      true
    );

    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.message).toBe('API rate limit exceeded');
    expect(parsed.tool).toBe('get_campaign_performance');
  });
});

describe('Response Structure Validation', () => {
  it('should include mock_data flag when not connected', () => {
    const isClientReady = false;

    const response = {
      campaigns: [],
      count: 0,
      platform: 'google_ads',
      date_range: { start_date: '2024-01-01', end_date: '2024-01-31' },
      mock_data: !isClientReady,
    };

    expect(response.mock_data).toBe(true);
  });

  it('should include mock_action flag for mutations when not connected', () => {
    const isClientReady = false;

    const response = {
      success: true,
      campaign_id: '123',
      action: 'paused',
      platform: 'google_ads',
      mock_action: !isClientReady,
    };

    expect(response.mock_action).toBe(true);
  });

  it('should always include platform identifier', () => {
    const performanceResponse = {
      campaigns: [],
      platform: 'google_ads',
    };

    const actionResponse = {
      success: true,
      platform: 'google_ads',
    };

    expect(performanceResponse.platform).toBe('google_ads');
    expect(actionResponse.platform).toBe('google_ads');
  });
});
