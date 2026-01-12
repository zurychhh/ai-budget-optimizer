/**
 * Shared TypeScript types for MCP servers
 *
 * These types define the common data structures used across all
 * advertising platform MCP servers.
 */

// =============================================================================
// Date Range
// =============================================================================

export interface DateRange {
  start_date: string; // YYYY-MM-DD format
  end_date: string;   // YYYY-MM-DD format
}

// =============================================================================
// Campaign Data
// =============================================================================

export interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  status: CampaignStatus;
  budget_usd: number;
  impressions: number;
  clicks: number;
  cost_usd: number;
  conversions: number;
  revenue_usd: number;
  cpc: number;
  cpm: number;
  ctr: number;
  roas: number;
}

export type CampaignStatus =
  | 'ENABLED'
  | 'PAUSED'
  | 'REMOVED'
  | 'PENDING'
  | 'ENDED'
  | 'UNKNOWN';

export interface CampaignPerformanceResponse {
  campaigns: CampaignPerformance[];
  count: number;
  platform: string;
  date_range: DateRange;
}

// =============================================================================
// Budget Update
// =============================================================================

export interface BudgetUpdateResult {
  success: boolean;
  campaign_id: string;
  campaign_name?: string;
  old_budget_usd: number;
  new_budget_usd: number;
  platform: string;
}

// =============================================================================
// Campaign Status Change
// =============================================================================

export interface CampaignStatusResult {
  success: boolean;
  campaign_id: string;
  campaign_name?: string;
  action: 'paused' | 'resumed';
  platform: string;
}

// =============================================================================
// Tool Input Schemas
// =============================================================================

export interface GetCampaignPerformanceInput {
  date_range: DateRange;
  campaign_ids?: string[];
}

export interface UpdateCampaignBudgetInput {
  campaign_id: string;
  new_budget_micros?: number;  // For Google Ads (1 USD = 1,000,000 micros)
  new_budget?: number;         // For other platforms (USD)
}

export interface CampaignActionInput {
  campaign_id: string;
}

// =============================================================================
// MCP Tool Response
// =============================================================================

export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

// =============================================================================
// Error Types
// =============================================================================

export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public platform: string
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class AuthenticationError extends MCPError {
  constructor(platform: string, message: string) {
    super(message, 'AUTH_ERROR', platform);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends MCPError {
  constructor(platform: string, retryAfter?: number) {
    super(
      `Rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter}s` : ''}`,
      'RATE_LIMIT',
      platform
    );
    this.name = 'RateLimitError';
  }
}

export class CampaignNotFoundError extends MCPError {
  constructor(platform: string, campaignId: string) {
    super(`Campaign ${campaignId} not found`, 'NOT_FOUND', platform);
    this.name = 'CampaignNotFoundError';
  }
}

// =============================================================================
// Configuration
// =============================================================================

export interface MCPServerConfig {
  name: string;
  version: string;
  platform: string;
  port: number;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert micros to USD (Google Ads uses micros: 1 USD = 1,000,000 micros)
 */
export function microsToUsd(micros: number): number {
  return micros / 1_000_000;
}

/**
 * Convert USD to micros
 */
export function usdToMicros(usd: number): number {
  return Math.round(usd * 1_000_000);
}

/**
 * Calculate CTR (Click-Through Rate)
 */
export function calculateCtr(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return Number((clicks / impressions).toFixed(4));
}

/**
 * Calculate CPC (Cost Per Click)
 */
export function calculateCpc(cost: number, clicks: number): number {
  if (clicks === 0) return 0;
  return Number((cost / clicks).toFixed(2));
}

/**
 * Calculate CPM (Cost Per Mille/Thousand Impressions)
 */
export function calculateCpm(cost: number, impressions: number): number {
  if (impressions === 0) return 0;
  return Number(((cost / impressions) * 1000).toFixed(2));
}

/**
 * Calculate ROAS (Return On Ad Spend)
 */
export function calculateRoas(revenue: number, cost: number): number {
  if (cost === 0) return 0;
  return Number((revenue / cost).toFixed(2));
}

/**
 * Format MCP tool response
 */
export function formatToolResponse(data: unknown, isError = false): MCPToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
    isError,
  };
}

/**
 * Format error response
 */
export function formatErrorResponse(error: Error | MCPError): MCPToolResponse {
  const errorData = {
    error: true,
    message: error.message,
    code: error instanceof MCPError ? error.code : 'UNKNOWN_ERROR',
    platform: error instanceof MCPError ? error.platform : 'unknown',
  };

  return formatToolResponse(errorData, true);
}
