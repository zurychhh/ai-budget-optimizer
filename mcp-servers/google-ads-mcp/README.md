# Google Ads MCP Server

MCP (Model Context Protocol) server for Google Ads integration.

## Setup

```bash
# Install dependencies
npm install

# Build
npm run build

# Start
npm start

# Development with hot reload
npm run dev
```

## Configuration

The server reads configuration from environment variables. Create a `.env` file in the project root:

```env
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=123-456-7890
GOOGLE_ADS_LOGIN_CUSTOMER_ID=  # Optional, for MCC accounts
MCP_GOOGLE_ADS_PORT=3001
```

## Mock Mode

If credentials are not configured, the server runs in **mock mode** and returns sample data. This is useful for development and testing.

## Available Tools

### get_campaign_performance

Fetch campaign performance metrics for a date range.

**Input:**
```json
{
  "date_range": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-07"
  },
  "campaign_ids": ["123456789"]  // optional
}
```

**Output:**
```json
{
  "campaigns": [
    {
      "campaign_id": "123456789",
      "campaign_name": "Brand Search",
      "status": "ENABLED",
      "budget_usd": 50.00,
      "impressions": 125000,
      "clicks": 4500,
      "cost_usd": 4850.00,
      "conversions": 145,
      "revenue_usd": 16900.00,
      "cpc": 1.08,
      "ctr": 0.036,
      "roas": 3.48
    }
  ],
  "count": 1,
  "platform": "google_ads"
}
```

### update_campaign_budget

Update the daily budget for a campaign.

**Input:**
```json
{
  "campaign_id": "123456789",
  "new_budget_micros": 75000000  // $75/day
}
```

**Note:** Google Ads uses micros (1 USD = 1,000,000 micros).

### pause_campaign

Pause an active campaign.

**Input:**
```json
{
  "campaign_id": "123456789"
}
```

### resume_campaign

Resume a paused campaign.

**Input:**
```json
{
  "campaign_id": "123456789"
}
```

## Testing with curl

```bash
# List available tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js

# Get campaign performance
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_campaign_performance","arguments":{"date_range":{"start_date":"2026-01-01","end_date":"2026-01-07"}}}}' | node dist/index.js
```

## Architecture

```
src/
├── index.ts           # Main MCP server
├── config.ts          # Environment configuration
└── google-ads-client.ts  # Google Ads API wrapper
```

## Google Ads API Resources

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/start)
- [google-ads-api npm package](https://www.npmjs.com/package/google-ads-api)
- [Get Developer Token](https://developers.google.com/google-ads/api/docs/first-call/dev-token)
