import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock handlers for API
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const username = params.get('username');
    const password = params.get('password');

    if (username === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
      });
    }
    return new HttpResponse(null, { status: 401 });
  }),

  http.get('/api/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth?.includes('mock-access-token')) {
      return HttpResponse.json({
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'analyst',
        is_active: true,
      });
    }
    return new HttpResponse(null, { status: 401 });
  }),

  http.post('/api/auth/refresh', async ({ request }) => {
    const body = await request.json() as { refresh_token: string };
    if (body.refresh_token === 'mock-refresh-token') {
      return HttpResponse.json({
        access_token: 'new-mock-access-token',
        refresh_token: 'new-mock-refresh-token',
        token_type: 'bearer',
      });
    }
    return new HttpResponse(null, { status: 401 });
  }),

  // Campaign endpoints
  http.get('/api/campaigns/performance', () => {
    return HttpResponse.json({
      campaigns: [
        {
          campaign_id: 'camp-1',
          campaign_name: 'Brand Campaign',
          status: 'ENABLED',
          budget_usd: 100,
          impressions: 10000,
          clicks: 500,
          cost_usd: 50,
          conversions: 25,
          revenue_usd: 500,
          cpc: 0.1,
          ctr: 0.05,
          roas: 10,
        },
      ],
      count: 1,
      platforms_queried: ['google_ads'],
    });
  }),

  http.get('/api/platforms/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      platforms: {
        google_ads: true,
        meta_ads: true,
        tiktok_ads: false,
        linkedin_ads: true,
      },
    });
  }),

  // Health endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];

// Setup MSW server
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
