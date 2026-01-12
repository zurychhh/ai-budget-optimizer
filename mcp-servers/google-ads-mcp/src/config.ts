/**
 * Google Ads MCP Server Configuration
 *
 * Loads configuration from environment variables.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface GoogleAdsConfig {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string;
}

export interface ServerConfig {
  name: string;
  version: string;
  port: number;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    console.error('Please check your .env file and ensure all Google Ads credentials are set.');
    // Don't throw in development - allow server to start for testing
    return `PLACEHOLDER_${key}`;
  }
  return value;
}

export const googleAdsConfig: GoogleAdsConfig = {
  developerToken: getRequiredEnv('GOOGLE_ADS_DEVELOPER_TOKEN'),
  clientId: getRequiredEnv('GOOGLE_ADS_CLIENT_ID'),
  clientSecret: getRequiredEnv('GOOGLE_ADS_CLIENT_SECRET'),
  refreshToken: getRequiredEnv('GOOGLE_ADS_REFRESH_TOKEN'),
  customerId: getRequiredEnv('GOOGLE_ADS_CUSTOMER_ID').replace(/-/g, ''),
  loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, ''),
};

export const serverConfig: ServerConfig = {
  name: 'google-ads-mcp',
  version: '1.0.0',
  port: parseInt(process.env.MCP_GOOGLE_ADS_PORT || '3001', 10),
};

/**
 * Check if we have valid credentials (not placeholders)
 */
export function hasValidCredentials(): boolean {
  return !googleAdsConfig.developerToken.startsWith('PLACEHOLDER_');
}
