/**
 * Google Ads MCP Server
 *
 * Exposes Google Ads API functionality via MCP (Model Context Protocol)
 * for use by Claude and other AI assistants.
 *
 * Tools:
 * - get_campaign_performance: Fetch campaign metrics
 * - update_campaign_budget: Update campaign budget
 * - pause_campaign: Pause a campaign
 * - resume_campaign: Resume a paused campaign
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { serverConfig, hasValidCredentials } from './config.js';
import {
  initializeClient,
  isClientReady,
  getCampaignPerformance,
  getCampaignWithBudget,
  updateBudget,
  updateCampaignStatus,
} from './google-ads-client.js';

// =============================================================================
// Types
// =============================================================================

interface DateRange {
  start_date: string;
  end_date: string;
}

interface GetPerformanceArgs {
  date_range: DateRange;
  campaign_ids?: string[];
}

interface UpdateBudgetArgs {
  campaign_id: string;
  new_budget_micros: number;
}

interface CampaignActionArgs {
  campaign_id: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function microsToUsd(micros: number | string): number {
  const value = typeof micros === 'string' ? parseInt(micros, 10) : micros;
  return value / 1_000_000;
}

function formatToolResponse(data: unknown, isError = false) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
    isError,
  };
}

// =============================================================================
// Tool Handlers
// =============================================================================

async function handleGetCampaignPerformance(args: GetPerformanceArgs) {
  console.error('[GoogleAds] get_campaign_performance called');
  console.error(`[GoogleAds] Date range: ${args.date_range.start_date} to ${args.date_range.end_date}`);

  const results = await getCampaignPerformance(
    args.date_range.start_date,
    args.date_range.end_date,
    args.campaign_ids
  );

  const campaigns = results.map((row) => {
    const costUsd = microsToUsd(row.metrics.cost_micros);
    const clicks = parseInt(row.metrics.clicks, 10);
    const impressions = parseInt(row.metrics.impressions, 10);
    const conversions = parseFloat(row.metrics.conversions);
    const revenue = parseFloat(row.metrics.conversions_value);

    return {
      campaign_id: row.campaign.id,
      campaign_name: row.campaign.name,
      status: row.campaign.status,
      budget_usd: microsToUsd(row.campaign_budget.amount_micros),
      impressions,
      clicks,
      cost_usd: costUsd,
      conversions,
      revenue_usd: revenue,
      cpc: clicks > 0 ? Number((costUsd / clicks).toFixed(2)) : 0,
      cpm: impressions > 0 ? Number(((costUsd / impressions) * 1000).toFixed(2)) : 0,
      ctr: impressions > 0 ? Number((clicks / impressions).toFixed(4)) : 0,
      roas: costUsd > 0 ? Number((revenue / costUsd).toFixed(2)) : 0,
    };
  });

  return formatToolResponse({
    campaigns,
    count: campaigns.length,
    platform: 'google_ads',
    date_range: args.date_range,
    mock_data: !isClientReady(),
  });
}

async function handleUpdateCampaignBudget(args: UpdateBudgetArgs) {
  console.error(`[GoogleAds] update_campaign_budget called for campaign ${args.campaign_id}`);

  if (!args.new_budget_micros || args.new_budget_micros <= 0) {
    return formatToolResponse(
      { error: true, message: 'new_budget_micros must be a positive number' },
      true
    );
  }

  // Get campaign to find its budget ID
  const campaign = await getCampaignWithBudget(args.campaign_id);

  if (!campaign) {
    return formatToolResponse(
      { error: true, message: `Campaign ${args.campaign_id} not found` },
      true
    );
  }

  const oldBudgetMicros = parseInt(campaign.campaign_budget.amount_micros, 10);

  // Update budget
  await updateBudget(campaign.campaign_budget.id, args.new_budget_micros);

  return formatToolResponse({
    success: true,
    campaign_id: args.campaign_id,
    campaign_name: campaign.campaign.name,
    old_budget_usd: microsToUsd(oldBudgetMicros),
    new_budget_usd: microsToUsd(args.new_budget_micros),
    platform: 'google_ads',
    mock_action: !isClientReady(),
  });
}

async function handlePauseCampaign(args: CampaignActionArgs) {
  console.error(`[GoogleAds] pause_campaign called for campaign ${args.campaign_id}`);

  await updateCampaignStatus(args.campaign_id, 'PAUSED');

  return formatToolResponse({
    success: true,
    campaign_id: args.campaign_id,
    action: 'paused',
    platform: 'google_ads',
    mock_action: !isClientReady(),
  });
}

async function handleResumeCampaign(args: CampaignActionArgs) {
  console.error(`[GoogleAds] resume_campaign called for campaign ${args.campaign_id}`);

  await updateCampaignStatus(args.campaign_id, 'ENABLED');

  return formatToolResponse({
    success: true,
    campaign_id: args.campaign_id,
    action: 'resumed',
    platform: 'google_ads',
    mock_action: !isClientReady(),
  });
}

// =============================================================================
// MCP Server Setup
// =============================================================================

const server = new Server(
  {
    name: serverConfig.name,
    version: serverConfig.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_campaign_performance',
        description:
          'Get Google Ads campaign performance metrics for a date range. Returns impressions, clicks, cost, conversions, revenue, and calculated metrics (CPC, CTR, ROAS).',
        inputSchema: {
          type: 'object',
          properties: {
            date_range: {
              type: 'object',
              properties: {
                start_date: {
                  type: 'string',
                  format: 'date',
                  description: 'Start date in YYYY-MM-DD format',
                },
                end_date: {
                  type: 'string',
                  format: 'date',
                  description: 'End date in YYYY-MM-DD format',
                },
              },
              required: ['start_date', 'end_date'],
            },
            campaign_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional list of campaign IDs to filter',
            },
          },
          required: ['date_range'],
        },
      },
      {
        name: 'update_campaign_budget',
        description:
          'Update the daily budget for a Google Ads campaign. Budget is specified in micros (1 USD = 1,000,000 micros).',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: {
              type: 'string',
              description: 'Campaign ID to update',
            },
            new_budget_micros: {
              type: 'number',
              description:
                'New daily budget in micros (1 USD = 1,000,000 micros). Example: $50/day = 50000000',
            },
          },
          required: ['campaign_id', 'new_budget_micros'],
        },
      },
      {
        name: 'pause_campaign',
        description: 'Pause an active Google Ads campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: {
              type: 'string',
              description: 'Campaign ID to pause',
            },
          },
          required: ['campaign_id'],
        },
      },
      {
        name: 'resume_campaign',
        description: 'Resume a paused Google Ads campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: {
              type: 'string',
              description: 'Campaign ID to resume',
            },
          },
          required: ['campaign_id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_campaign_performance':
        return await handleGetCampaignPerformance(args as unknown as GetPerformanceArgs);

      case 'update_campaign_budget':
        return await handleUpdateCampaignBudget(args as unknown as UpdateBudgetArgs);

      case 'pause_campaign':
        return await handlePauseCampaign(args as unknown as CampaignActionArgs);

      case 'resume_campaign':
        return await handleResumeCampaign(args as unknown as CampaignActionArgs);

      default:
        return formatToolResponse(
          { error: true, message: `Unknown tool: ${name}` },
          true
        );
    }
  } catch (error) {
    console.error(`[GoogleAds] Error in ${name}:`, error);
    return formatToolResponse(
      {
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error',
        tool: name,
      },
      true
    );
  }
});

// =============================================================================
// Main
// =============================================================================

async function main() {
  // Initialize Google Ads client
  try {
    initializeClient();
  } catch (error) {
    console.error('[GoogleAds] Client initialization failed, running in mock mode');
  }

  // Log credential status
  if (hasValidCredentials()) {
    console.error('[GoogleAds] Running with valid credentials');
  } else {
    console.error('[GoogleAds] Running in MOCK MODE - configure credentials in .env');
  }

  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`${serverConfig.name} v${serverConfig.version} running on stdio`);
}

main().catch((error) => {
  console.error('[GoogleAds] Fatal error:', error);
  process.exit(1);
});
