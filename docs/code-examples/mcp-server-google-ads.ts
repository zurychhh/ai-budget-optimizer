/**
 * Google Ads MCP Server - Complete Implementation
 *
 * This server exposes Google Ads API functionality via MCP (Model Context Protocol)
 * for use by Claude and other AI assistants.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const config = {
  port: parseInt(process.env.MCP_GOOGLE_ADS_PORT || '3001'),
  googleAds: {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    clientId: process.env.GOOGLE_ADS_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, ''),
  },
  server: {
    name: 'google-ads-mcp',
    version: '1.0.0',
  },
};

// Validate required environment variables
const required = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Initialize Google Ads client
const client = new GoogleAdsApi({
  client_id: config.googleAds.clientId,
  client_secret: config.googleAds.clientSecret,
  developer_token: config.googleAds.developerToken,
});

const customer = client.Customer({
  customer_id: config.googleAds.customerId,
  refresh_token: config.googleAds.refreshToken,
});

// Create MCP server
const server = new Server(
  {
    name: config.server.name,
    version: config.server.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'get_campaign_performance',
        description: 'Get Google Ads campaign performance metrics for a date range',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional list of campaign IDs to filter',
            },
            date_range: {
              type: 'object',
              properties: {
                start_date: { type: 'string', format: 'date' },
                end_date: { type: 'string', format: 'date' },
              },
              required: ['start_date', 'end_date'],
            },
          },
          required: ['date_range'],
        },
      },
      {
        name: 'update_campaign_budget',
        description: 'Update the daily budget for a campaign (amount in micros: 1 USD = 1,000,000)',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: { type: 'string' },
            new_budget_micros: {
              type: 'number',
              description: 'New budget in micros (1 USD = 1,000,000 micros)',
            },
          },
          required: ['campaign_id', 'new_budget_micros'],
        },
      },
      {
        name: 'pause_campaign',
        description: 'Pause an active campaign',
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
        description: 'Resume a paused campaign',
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

// Tool execution handler
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_campaign_performance':
        return await getPerformance(args);
      case 'update_campaign_budget':
        return await updateBudget(args);
      case 'pause_campaign':
        return await pauseCampaign(args);
      case 'resume_campaign':
        return await resumeCampaign(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Tool implementations
async function getPerformance(args: any) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${args.date_range.start_date}'
      AND '${args.date_range.end_date}'
    ${args.campaign_ids ? `AND campaign.id IN (${args.campaign_ids.join(',')})` : ''}
    ORDER BY metrics.cost_micros DESC
  `;

  const results = await customer.query(query);

  const formatted = results.map((row: any) => ({
    campaign_id: row.campaign.id,
    campaign_name: row.campaign.name,
    status: row.campaign.status,
    budget_usd: row.campaign_budget.amount_micros / 1_000_000,
    impressions: parseInt(row.metrics.impressions),
    clicks: parseInt(row.metrics.clicks),
    cost_usd: row.metrics.cost_micros / 1_000_000,
    conversions: parseFloat(row.metrics.conversions),
    revenue_usd: row.metrics.conversions_value,
    cpc: row.metrics.clicks > 0
      ? (row.metrics.cost_micros / 1_000_000 / row.metrics.clicks).toFixed(2)
      : 0,
    roas: row.metrics.cost_micros > 0
      ? (row.metrics.conversions_value / (row.metrics.cost_micros / 1_000_000)).toFixed(2)
      : 0,
  }));

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ campaigns: formatted, count: formatted.length }, null, 2),
      },
    ],
  };
}

async function updateBudget(args: any) {
  // Get campaign to find its budget ID
  const campaignQuery = `
    SELECT
      campaign.id,
      campaign.name,
      campaign_budget.id,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.id = ${args.campaign_id}
  `;

  const campaigns = await customer.query(campaignQuery);
  if (campaigns.length === 0) {
    throw new Error(`Campaign ${args.campaign_id} not found`);
  }

  const budgetId = campaigns[0].campaign_budget.id;
  const oldBudget = campaigns[0].campaign_budget.amount_micros;

  // Update budget
  await customer.campaignBudgets.update({
    campaign_budget: budgetId,
    amount_micros: args.new_budget_micros,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          campaign_id: args.campaign_id,
          campaign_name: campaigns[0].campaign.name,
          old_budget_usd: oldBudget / 1_000_000,
          new_budget_usd: args.new_budget_micros / 1_000_000,
        }, null, 2),
      },
    ],
  };
}

async function pauseCampaign(args: any) {
  await customer.campaigns.update({
    campaign: args.campaign_id,
    status: 'PAUSED',
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          campaign_id: args.campaign_id,
          action: 'paused',
        }),
      },
    ],
  };
}

async function resumeCampaign(args: any) {
  await customer.campaigns.update({
    campaign: args.campaign_id,
    status: 'ENABLED',
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          campaign_id: args.campaign_id,
          action: 'resumed',
        }),
      },
    ],
  };
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${config.server.name} v${config.server.version} running on stdio`);
}

main().catch(console.error);
