/**
 * Tests for Google Ads MCP Server Configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Config Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('hasValidCredentials', () => {
    it('should return false when credentials are placeholders', async () => {
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN = '';
      process.env.GOOGLE_ADS_CLIENT_ID = '';
      process.env.GOOGLE_ADS_CLIENT_SECRET = '';
      process.env.GOOGLE_ADS_REFRESH_TOKEN = '';
      process.env.GOOGLE_ADS_CUSTOMER_ID = '';

      const { hasValidCredentials } = await import('../config.js');
      expect(hasValidCredentials()).toBe(false);
    });

    it('should return true when all credentials are valid', async () => {
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'real-token';
      process.env.GOOGLE_ADS_CLIENT_ID = 'client-id';
      process.env.GOOGLE_ADS_CLIENT_SECRET = 'client-secret';
      process.env.GOOGLE_ADS_REFRESH_TOKEN = 'refresh-token';
      process.env.GOOGLE_ADS_CUSTOMER_ID = '123-456-7890';

      const { hasValidCredentials } = await import('../config.js');
      expect(hasValidCredentials()).toBe(true);
    });
  });

  describe('googleAdsConfig', () => {
    it('should strip dashes from customer ID', async () => {
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'token';
      process.env.GOOGLE_ADS_CLIENT_ID = 'client-id';
      process.env.GOOGLE_ADS_CLIENT_SECRET = 'secret';
      process.env.GOOGLE_ADS_REFRESH_TOKEN = 'refresh';
      process.env.GOOGLE_ADS_CUSTOMER_ID = '123-456-7890';

      const { googleAdsConfig } = await import('../config.js');
      expect(googleAdsConfig.customerId).toBe('1234567890');
    });

    it('should handle login customer ID with dashes', async () => {
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'token';
      process.env.GOOGLE_ADS_CLIENT_ID = 'client-id';
      process.env.GOOGLE_ADS_CLIENT_SECRET = 'secret';
      process.env.GOOGLE_ADS_REFRESH_TOKEN = 'refresh';
      process.env.GOOGLE_ADS_CUSTOMER_ID = '1234567890';
      process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID = '999-888-7777';

      const { googleAdsConfig } = await import('../config.js');
      expect(googleAdsConfig.loginCustomerId).toBe('9998887777');
    });

    it('should allow undefined login customer ID', async () => {
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'token';
      process.env.GOOGLE_ADS_CLIENT_ID = 'client-id';
      process.env.GOOGLE_ADS_CLIENT_SECRET = 'secret';
      process.env.GOOGLE_ADS_REFRESH_TOKEN = 'refresh';
      process.env.GOOGLE_ADS_CUSTOMER_ID = '1234567890';
      delete process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

      const { googleAdsConfig } = await import('../config.js');
      expect(googleAdsConfig.loginCustomerId).toBeUndefined();
    });
  });

  describe('serverConfig', () => {
    it('should use default port 3001', async () => {
      delete process.env.MCP_GOOGLE_ADS_PORT;

      const { serverConfig } = await import('../config.js');
      expect(serverConfig.port).toBe(3001);
    });

    it('should use custom port from env', async () => {
      process.env.MCP_GOOGLE_ADS_PORT = '4001';

      const { serverConfig } = await import('../config.js');
      expect(serverConfig.port).toBe(4001);
    });

    it('should have correct server name and version', async () => {
      const { serverConfig } = await import('../config.js');
      expect(serverConfig.name).toBe('google-ads-mcp');
      expect(serverConfig.version).toBe('1.0.0');
    });
  });
});
