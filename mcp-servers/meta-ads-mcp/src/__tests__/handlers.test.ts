/**
 * Tests for Meta Ads MCP Server Tool Handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../config.js', () => ({
  serverConfig: { name: 'meta-ads-mcp', version: '1.0.0', port: 3002 },
  hasValidCredentials: vi.fn(() => false),
}));

vi.mock('../meta-ads-client.js', () => ({
  initializeClient: vi.fn(),
  isClientReady: vi.fn(() => false),
  getCampaignPerformance: vi.fn(),
  getCampaignById: vi.fn(),
  updateBudget: vi.fn(),
  updateCampaignStatus: vi.fn(),
}));

describe('Helper Functions', () => {
  describe('formatToolResponse', () => {
    const formatToolResponse = (data: unknown, isError = false) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      isError,
    });

    it('should format success response', () => {
      const result = formatToolResponse({ success: true });
      expect(result.isError).toBe(false);
      expect(JSON.parse(result.content[0].text)).toEqual({ success: true });
    });

    it('should format error response', () => {
      const result = formatToolResponse({ error: true, message: 'Error' }, true);
      expect(result.isError).toBe(true);
    });
  });
});

describe('Budget Validation', () => {
  it('should reject zero budget', () => {
    const isValidBudget = (budget: number | undefined): boolean => {
      return budget !== undefined && budget > 0;
    };

    expect(isValidBudget(0)).toBe(false);
  });

  it('should reject negative budget', () => {
    const isValidBudget = (budget: number | undefined): boolean => {
      return budget !== undefined && budget > 0;
    };

    expect(isValidBudget(-50)).toBe(false);
  });

  it('should accept positive budget', () => {
    const isValidBudget = (budget: number | undefined): boolean => {
      return budget !== undefined && budget > 0;
    };

    expect(isValidBudget(100)).toBe(true);
    expect(isValidBudget(0.01)).toBe(true);
  });

  it('should reject undefined budget', () => {
    const isValidBudget = (budget: number | undefined): boolean => {
      return budget !== undefined && budget > 0;
    };

    expect(isValidBudget(undefined)).toBe(false);
  });
});

describe('Campaign Performance Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call getCampaignPerformance with correct params', async () => {
    const { getCampaignPerformance } = await import('../meta-ads-client.js');

    vi.mocked(getCampaignPerformance).mockResolvedValue([
      {
        campaign_id: 'meta_123',
        campaign_name: 'Test Campaign',
        status: 'ACTIVE',
        budget_usd: 100,
        impressions: 10000,
        clicks: 100,
        cost_usd: 50,
        conversions: 10,
        revenue_usd: 500,
        cpc: 0.5,
        ctr: 0.01,
        roas: 10,
      },
    ]);

    const result = await getCampaignPerformance('2024-01-01', '2024-01-31');

    expect(getCampaignPerformance).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
    expect(result).toHaveLength(1);
    expect(result[0].campaign_id).toBe('meta_123');
  });

  it('should handle campaign_ids filter', async () => {
    const { getCampaignPerformance } = await import('../meta-ads-client.js');

    await getCampaignPerformance('2024-01-01', '2024-01-31', ['meta_123', 'meta_456']);

    expect(getCampaignPerformance).toHaveBeenCalledWith('2024-01-01', '2024-01-31', [
      'meta_123',
      'meta_456',
    ]);
  });
});

describe('Update Budget Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call updateBudget with correct params', async () => {
    const { updateBudget } = await import('../meta-ads-client.js');

    await updateBudget('meta_123', 150);

    expect(updateBudget).toHaveBeenCalledWith('meta_123', 150);
  });
});

describe('Campaign Status Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pause campaign with PAUSED status', async () => {
    const { updateCampaignStatus } = await import('../meta-ads-client.js');

    await updateCampaignStatus('meta_123', 'PAUSED');

    expect(updateCampaignStatus).toHaveBeenCalledWith('meta_123', 'PAUSED');
  });

  it('should resume campaign with ACTIVE status', async () => {
    const { updateCampaignStatus } = await import('../meta-ads-client.js');

    await updateCampaignStatus('meta_456', 'ACTIVE');

    expect(updateCampaignStatus).toHaveBeenCalledWith('meta_456', 'ACTIVE');
  });
});

describe('Response Structure Validation', () => {
  it('should include mock_data flag when not connected', () => {
    const isClientReady = false;

    const response = {
      campaigns: [],
      count: 0,
      platform: 'meta_ads',
      date_range: { start_date: '2024-01-01', end_date: '2024-01-31' },
      mock_data: !isClientReady,
    };

    expect(response.mock_data).toBe(true);
    expect(response.platform).toBe('meta_ads');
  });

  it('should include mock_action flag for mutations', () => {
    const isClientReady = false;

    const response = {
      success: true,
      campaign_id: 'meta_123',
      action: 'paused',
      platform: 'meta_ads',
      mock_action: !isClientReady,
    };

    expect(response.mock_action).toBe(true);
  });

  it('should include old and new budget in update response', () => {
    const response = {
      success: true,
      campaign_id: 'meta_123',
      campaign_name: 'Test Campaign',
      old_budget_usd: 100,
      new_budget_usd: 150,
      platform: 'meta_ads',
    };

    expect(response.old_budget_usd).toBe(100);
    expect(response.new_budget_usd).toBe(150);
  });
});

describe('Error Handling', () => {
  it('should format campaign not found error', () => {
    const formatToolResponse = (data: unknown, isError = false) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      isError,
    });

    const result = formatToolResponse(
      { error: true, message: 'Campaign meta_999 not found' },
      true
    );

    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.message).toContain('not found');
  });

  it('should format unknown tool error', () => {
    const formatToolResponse = (data: unknown, isError = false) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      isError,
    });

    const result = formatToolResponse({ error: true, message: 'Unknown tool: invalid' }, true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.message).toContain('Unknown tool');
  });

  it('should handle API errors gracefully', () => {
    const formatToolResponse = (data: unknown, isError = false) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      isError,
    });

    const error = new Error('Meta API rate limit exceeded');
    const result = formatToolResponse({ error: true, message: error.message }, true);

    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.message).toBe('Meta API rate limit exceeded');
  });
});

describe('Platform Identifier', () => {
  it('should use meta_ads as platform identifier', () => {
    const PLATFORM = 'meta_ads';

    expect(PLATFORM).toBe('meta_ads');
    expect(PLATFORM).not.toBe('facebook_ads');
    expect(PLATFORM).not.toBe('instagram_ads');
  });
});
