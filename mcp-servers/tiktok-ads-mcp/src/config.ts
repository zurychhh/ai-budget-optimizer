/**
 * TikTok Ads MCP Server Configuration
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

export const tiktokAdsConfig = {
  appId: process.env.TIKTOK_APP_ID || '',
  appSecret: process.env.TIKTOK_APP_SECRET || '',
  accessToken: process.env.TIKTOK_ACCESS_TOKEN || '',
  advertiserId: process.env.TIKTOK_ADVERTISER_ID || '',
};

export const serverConfig = {
  name: 'tiktok-ads-mcp',
  version: '1.0.0',
  port: parseInt(process.env.MCP_TIKTOK_ADS_PORT || '3003', 10),
};

export function hasValidCredentials(): boolean {
  return !!(
    tiktokAdsConfig.appId &&
    tiktokAdsConfig.appSecret &&
    tiktokAdsConfig.accessToken &&
    tiktokAdsConfig.advertiserId
  );
}
