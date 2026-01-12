/**
 * Meta Ads MCP Server
 *
 * Exposes Meta (Facebook/Instagram) Ads API functionality via MCP
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
  getCampaignById,
  updateBudget,
  updateCampaignStatus,
} from './meta-ads-client.js';

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
  new_budget: number;
}

interface CampaignActionArgs {
  campaign_id: string;
}

// =============================================================================
// Helpers
// =============================================================================

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
  console.error('[MetaAds] get_campaign_performance called');

  const campaigns = await getCampaignPerformance(
    args.date_range.start_date,
    args.date_range.end_date,
    args.campaign_ids
  );

  return formatToolResponse({
    campaigns,
    count: campaigns.length,
    platform: 'meta_ads',
    date_range: args.date_range,
    mock_data: !isClientReady(),
  });
}

async function handleUpdateCampaignBudget(args: UpdateBudgetArgs) {
  console.error(`[MetaAds] update_campaign_budget called for ${args.campaign_id}`);

  if (!args.new_budget || args.new_budget <= 0) {
    return formatToolResponse(
      { error: true, message: 'new_budget must be positive' },
      true
    );
  }

  const campaign = await getCampaignById(args.campaign_id);
  if (!campaign) {
    return formatToolResponse(
      { error: true, message: `Campaign ${args.campaign_id} not found` },
      true
    );
  }

  const oldBudget = campaign.budget_usd;
  await updateBudget(args.campaign_id, args.new_budget);

  return formatToolResponse({
    success: true,
    campaign_id: args.campaign_id,
    campaign_name: campaign.campaign_name,
    old_budget_usd: oldBudget,
    new_budget_usd: args.new_budget,
    platform: 'meta_ads',
    mock_action: !isClientReady(),
  });
}

async function handlePauseCampaign(args: CampaignActionArgs) {
  console.error(`[MetaAds] pause_campaign called for ${args.campaign_id}`);

  await updateCampaignStatus(args.campaign_id, 'PAUSED');

  return formatToolResponse({
    success: true,
    campaign_id: args.campaign_id,
    action: 'paused',
    platform: 'meta_ads',
    mock_action: !isClientReady(),
  });
}

async function handleResumeCampaign(args: CampaignActionArgs) {
  console.error(`[MetaAds] resume_campaign called for ${args.campaign_id}`);

  await updateCampaignStatus(args.campaign_id, 'ACTIVE');

  return formatToolResponse({
    success: true,
    campaign_id: args.campaign_id,
    action: 'resumed',
    platform: 'meta_ads',
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

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_campaign_performance',
        description:
          'Get Meta (Facebook/Instagram) Ads campaign performance metrics for a date range.',
        inputSchema: {
          type: 'object',
          properties: {
            date_range: {
              type: 'object',
              properties: {
                start_date: { type: 'string', format: 'date' },
                end_date: { type: 'string', format: 'date' },
              },
              required: ['start_date', 'end_date'],
            },
            campaign_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional campaign IDs to filter',
            },
          },
          required: ['date_range'],
        },
      },
      {
        name: 'update_campaign_budget',
        description: 'Update the daily budget for a Meta Ads campaign in USD.',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: { type: 'string' },
            new_budget: { type: 'number', description: 'New daily budget in USD' },
          },
          required: ['campaign_id', 'new_budget'],
        },
      },
      {
        name: 'pause_campaign',
        description: 'Pause an active Meta Ads campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: { type: 'string' },
          },
          required: ['campaign_id'],
        },
      },
      {
        name: 'resume_campaign',
        description: 'Resume a paused Meta Ads campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: { type: 'string' },
          },
          required: ['campaign_id'],
        },
      },
    ],
  };
});

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
        return formatToolResponse({ error: true, message: `Unknown tool: ${name}` }, true);
    }
  } catch (error) {
    console.error(`[MetaAds] Error in ${name}:`, error);
    return formatToolResponse(
      { error: true, message: error instanceof Error ? error.message : 'Unknown error' },
      true
    );
  }
});

// =============================================================================
// Main
// =============================================================================

async function main() {
  try {
    initializeClient();
  } catch {
    console.error('[MetaAds] Client initialization failed, running in mock mode');
  }

  if (hasValidCredentials()) {
    console.error('[MetaAds] Running with valid credentials');
  } else {
    console.error('[MetaAds] Running in MOCK MODE');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`${serverConfig.name} v${serverConfig.version} running on stdio`);
}

main().catch((error) => {
  console.error('[MetaAds] Fatal error:', error);
  process.exit(1);
});
