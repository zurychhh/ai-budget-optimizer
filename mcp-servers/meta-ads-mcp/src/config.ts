/**
 * Meta Ads MCP Server Configuration
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

export const metaAdsConfig = {
  appId: process.env.META_APP_ID || '',
  appSecret: process.env.META_APP_SECRET || '',
  accessToken: process.env.META_ACCESS_TOKEN || '',
  adAccountId: process.env.META_AD_ACCOUNT_ID || '',
};

export const serverConfig = {
  name: 'meta-ads-mcp',
  version: '1.0.0',
  port: parseInt(process.env.MCP_META_ADS_PORT || '3002', 10),
};

export function hasValidCredentials(): boolean {
  return !!(
    metaAdsConfig.appId &&
    metaAdsConfig.appSecret &&
    metaAdsConfig.accessToken &&
    metaAdsConfig.adAccountId
  );
}
