/**
 * LinkedIn Ads MCP Server Configuration
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

export const linkedinAdsConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID || '',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
  adAccountId: process.env.LINKEDIN_AD_ACCOUNT_ID || '',
};

export const serverConfig = {
  name: 'linkedin-ads-mcp',
  version: '1.0.0',
  port: parseInt(process.env.MCP_LINKEDIN_ADS_PORT || '3004', 10),
};

export function hasValidCredentials(): boolean {
  return !!(
    linkedinAdsConfig.clientId &&
    linkedinAdsConfig.clientSecret &&
    linkedinAdsConfig.accessToken &&
    linkedinAdsConfig.adAccountId
  );
}
