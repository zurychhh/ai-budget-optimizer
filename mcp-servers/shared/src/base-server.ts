/**
 * Base MCP Server utilities
 *
 * Provides common functionality for all advertising platform MCP servers.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  MCPServerConfig,
  MCPToolResponse,
  formatErrorResponse,
} from './types.js';

// =============================================================================
// Tool Definitions
// =============================================================================

/**
 * Standard tool definitions that all ad platform MCP servers should implement
 */
export const STANDARD_TOOLS = [
  {
    name: 'get_campaign_performance',
    description: 'Get campaign performance metrics for a date range',
    inputSchema: {
      type: 'object' as const,
      properties: {
        date_range: {
          type: 'object' as const,
          properties: {
            start_date: {
              type: 'string' as const,
              format: 'date',
              description: 'Start date in YYYY-MM-DD format',
            },
            end_date: {
              type: 'string' as const,
              format: 'date',
              description: 'End date in YYYY-MM-DD format',
            },
          },
          required: ['start_date', 'end_date'],
        },
        campaign_ids: {
          type: 'array' as const,
          items: { type: 'string' as const },
          description: 'Optional list of campaign IDs to filter',
        },
      },
      required: ['date_range'],
    },
  },
  {
    name: 'update_campaign_budget',
    description: 'Update the daily budget for a campaign',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: {
          type: 'string' as const,
          description: 'Campaign ID to update',
        },
        new_budget_micros: {
          type: 'number' as const,
          description: 'New budget in micros (1 USD = 1,000,000 micros) - for Google Ads',
        },
        new_budget: {
          type: 'number' as const,
          description: 'New budget in USD - for other platforms',
        },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'pause_campaign',
    description: 'Pause an active campaign',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: {
          type: 'string' as const,
          description: 'Campaign ID to pause',
        },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'resume_campaign',
    description: 'Resume a paused campaign',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: {
          type: 'string' as const,
          description: 'Campaign ID to resume',
        },
      },
      required: ['campaign_id'],
    },
  },
];

// =============================================================================
// Server Factory
// =============================================================================

/**
 * Create and configure an MCP server instance
 */
export function createMCPServer(config: MCPServerConfig): Server {
  const server = new Server(
    {
      name: config.name,
      version: config.version,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  return server;
}

/**
 * Start the MCP server with stdio transport
 */
export async function startServer(
  server: Server,
  config: MCPServerConfig
): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${config.name} v${config.version} running on stdio`);
}

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Wrap a tool handler with error handling
 */
export function withErrorHandling(
  handler: (args: unknown) => Promise<MCPToolResponse>
): (args: unknown) => Promise<MCPToolResponse> {
  return async (args: unknown): Promise<MCPToolResponse> => {
    try {
      return await handler(args);
    } catch (error) {
      console.error('Tool execution error:', error);
      return formatErrorResponse(error as Error);
    }
  };
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate date range input
 */
export function validateDateRange(dateRange: {
  start_date?: string;
  end_date?: string;
}): void {
  if (!dateRange.start_date || !dateRange.end_date) {
    throw new Error('Both start_date and end_date are required');
  }

  const start = new Date(dateRange.start_date);
  const end = new Date(dateRange.end_date);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }

  if (start > end) {
    throw new Error('start_date must be before or equal to end_date');
  }
}

/**
 * Validate campaign ID
 */
export function validateCampaignId(campaignId?: string): void {
  if (!campaignId || campaignId.trim() === '') {
    throw new Error('campaign_id is required');
  }
}

/**
 * Validate budget amount
 */
export function validateBudget(budget?: number, isMicros = false): void {
  if (budget === undefined || budget === null) {
    throw new Error('Budget amount is required');
  }

  if (budget <= 0) {
    throw new Error('Budget must be a positive number');
  }

  // Sanity check for micros (max ~$1M daily budget)
  if (isMicros && budget > 1_000_000_000_000) {
    throw new Error('Budget amount seems too large');
  }

  // Sanity check for USD (max ~$1M daily budget)
  if (!isMicros && budget > 1_000_000) {
    throw new Error('Budget amount seems too large');
  }
}

// =============================================================================
// Logging
// =============================================================================

/**
 * Log tool call for debugging
 */
export function logToolCall(
  platform: string,
  toolName: string,
  args: unknown
): void {
  console.error(`[${platform}] Tool call: ${toolName}`);
  console.error(`[${platform}] Arguments: ${JSON.stringify(args)}`);
}

/**
 * Log tool result for debugging
 */
export function logToolResult(
  platform: string,
  toolName: string,
  success: boolean
): void {
  console.error(`[${platform}] ${toolName} completed: ${success ? 'SUCCESS' : 'FAILURE'}`);
}
