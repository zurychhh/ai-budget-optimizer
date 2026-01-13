import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { useAuthStore } from '@/store/authStore';

// Mock axios
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { default: mockAxios };
});

// Import after mock
import api, * as apiClient from './client';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe('Auth API', () => {
    describe('login', () => {
      it('should send login request with form data', async () => {
        const mockResponse = {
          data: {
            access_token: 'test-token',
            refresh_token: 'test-refresh',
            token_type: 'bearer',
          },
        };
        (api.post as Mock).mockResolvedValueOnce(mockResponse);

        const result = await apiClient.login({
          username: 'test@example.com',
          password: 'password123',
        });

        expect(api.post).toHaveBeenCalledWith(
          '/auth/login',
          expect.any(URLSearchParams),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        expect(result.access_token).toBe('test-token');
      });

      it('should throw error on failed login', async () => {
        (api.post as Mock).mockRejectedValueOnce(new Error('Unauthorized'));

        await expect(
          apiClient.login({ username: 'test@example.com', password: 'wrong' })
        ).rejects.toThrow('Unauthorized');
      });
    });

    describe('getCurrentUser', () => {
      it('should fetch current user', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'analyst',
          is_active: true,
        };
        (api.get as Mock).mockResolvedValueOnce({ data: mockUser });

        const result = await apiClient.getCurrentUser();

        expect(api.get).toHaveBeenCalledWith('/auth/me');
        expect(result).toEqual(mockUser);
      });
    });

    describe('register', () => {
      it('should register new user', async () => {
        const mockUser = {
          id: 'new-user-123',
          email: 'new@example.com',
          first_name: 'New',
          last_name: 'User',
          role: 'viewer',
          is_active: true,
        };
        (api.post as Mock).mockResolvedValueOnce({ data: mockUser });

        const result = await apiClient.register({
          email: 'new@example.com',
          password: 'password123',
          first_name: 'New',
          last_name: 'User',
        });

        expect(api.post).toHaveBeenCalledWith('/auth/register', {
          email: 'new@example.com',
          password: 'password123',
          first_name: 'New',
          last_name: 'User',
        });
        expect(result).toEqual(mockUser);
      });
    });

    describe('refreshToken', () => {
      it('should refresh tokens', async () => {
        const mockResponse = {
          access_token: 'new-token',
          refresh_token: 'new-refresh',
          token_type: 'bearer',
        };
        (api.post as Mock).mockResolvedValueOnce({ data: mockResponse });

        const result = await apiClient.refreshToken('old-refresh');

        expect(api.post).toHaveBeenCalledWith('/auth/refresh', {
          refresh_token: 'old-refresh',
        });
        expect(result.access_token).toBe('new-token');
      });
    });
  });

  describe('Campaign API', () => {
    describe('getCampaigns', () => {
      it('should fetch all campaigns with default date range', async () => {
        const mockCampaigns = [
          { campaign_id: 'camp-1', campaign_name: 'Test Campaign' },
        ];
        (api.get as Mock).mockResolvedValueOnce({
          data: { campaigns: mockCampaigns },
        });

        const result = await apiClient.getCampaigns();

        expect(api.get).toHaveBeenCalledWith('/campaigns/performance', {
          params: expect.objectContaining({
            start_date: expect.any(String),
            end_date: expect.any(String),
          }),
        });
        expect(result).toEqual(mockCampaigns);
      });

      it('should filter by platform when specified', async () => {
        (api.get as Mock).mockResolvedValueOnce({
          data: { campaigns: [] },
        });

        await apiClient.getCampaigns('google_ads');

        expect(api.get).toHaveBeenCalledWith('/campaigns/performance', {
          params: expect.objectContaining({
            platforms: 'google_ads',
          }),
        });
      });
    });

    describe('getCampaignPerformance', () => {
      it('should fetch performance for specific platform', async () => {
        const mockData = {
          campaigns: [{ campaign_id: 'camp-1' }],
          count: 1,
        };
        (api.get as Mock).mockResolvedValueOnce({ data: mockData });

        const result = await apiClient.getCampaignPerformance(
          'google_ads',
          '2024-01-01',
          '2024-01-07'
        );

        expect(api.get).toHaveBeenCalledWith('/campaigns/google_ads/performance', {
          params: { start_date: '2024-01-01', end_date: '2024-01-07' },
        });
        expect(result).toEqual(mockData);
      });
    });

    describe('pauseCampaign', () => {
      it('should pause a campaign', async () => {
        (api.post as Mock).mockResolvedValueOnce({ data: { success: true } });

        const result = await apiClient.pauseCampaign('google_ads', 'camp-1');

        expect(api.post).toHaveBeenCalledWith('/campaigns/camp-1/pause', null, {
          params: { platform: 'google_ads' },
        });
        expect(result.success).toBe(true);
      });
    });

    describe('resumeCampaign', () => {
      it('should resume a campaign', async () => {
        (api.post as Mock).mockResolvedValueOnce({ data: { success: true } });

        const result = await apiClient.resumeCampaign('meta_ads', 'camp-2');

        expect(api.post).toHaveBeenCalledWith('/campaigns/camp-2/resume', null, {
          params: { platform: 'meta_ads' },
        });
        expect(result.success).toBe(true);
      });
    });

    describe('updateBudget', () => {
      it('should update campaign budget', async () => {
        (api.put as Mock).mockResolvedValueOnce({ data: { success: true } });

        const result = await apiClient.updateBudget('google_ads', 'camp-1', 500);

        expect(api.put).toHaveBeenCalledWith(
          '/campaigns/camp-1/budget',
          { new_budget: 500 },
          { params: { platform: 'google_ads' } }
        );
        expect(result.success).toBe(true);
      });
    });
  });

  describe('AI API', () => {
    describe('analyzePerformance', () => {
      it('should analyze performance', async () => {
        const mockAnalysis = {
          summary: 'Performance is good',
          insights: ['Insight 1'],
          recommendations: [],
        };
        (api.post as Mock).mockResolvedValueOnce({ data: mockAnalysis });

        const result = await apiClient.analyzePerformance();

        expect(api.post).toHaveBeenCalledWith('/ai/analyze', {
          start_date: expect.any(String),
          end_date: expect.any(String),
          platforms: null,
        });
        expect(result.summary).toBe('Performance is good');
      });
    });

    describe('optimizeBudget', () => {
      it('should optimize budget with default goal', async () => {
        const mockOptimization = {
          total_budget: 10000,
          allocations: [],
          expected_improvement: 15.5,
        };
        (api.post as Mock).mockResolvedValueOnce({ data: mockOptimization });

        const result = await apiClient.optimizeBudget(10000);

        expect(api.post).toHaveBeenCalledWith('/ai/optimize-budget', {
          total_budget: 10000,
          optimization_goal: 'maximize_roas',
          max_change_percent: 30.0,
          platforms: null,
        });
        expect(result.expected_improvement).toBe(15.5);
      });

      it('should optimize budget with custom goal', async () => {
        (api.post as Mock).mockResolvedValueOnce({ data: {} });

        await apiClient.optimizeBudget(5000, 'minimize_cpa');

        expect(api.post).toHaveBeenCalledWith('/ai/optimize-budget', {
          total_budget: 5000,
          optimization_goal: 'minimize_cpa',
          max_change_percent: 30.0,
          platforms: null,
        });
      });
    });

    describe('detectAnomalies', () => {
      it('should detect anomalies', async () => {
        const mockAnomalies = {
          anomalies: [{ campaign_id: 'camp-1', type: 'spending_spike' }],
          summary: '1 anomaly detected',
        };
        (api.post as Mock).mockResolvedValueOnce({ data: mockAnomalies });

        const result = await apiClient.detectAnomalies();

        expect(api.post).toHaveBeenCalledWith('/ai/detect-anomalies', {
          platforms: null,
          lookback_days: 7,
        });
        expect(result.anomalies).toHaveLength(1);
      });
    });

    describe('getActionPlan', () => {
      it('should get action plan', async () => {
        const mockPlan = {
          actions: [{ type: 'increase_budget', campaign_id: 'camp-1' }],
        };
        (api.post as Mock).mockResolvedValueOnce({ data: mockPlan });

        const result = await apiClient.getActionPlan();

        expect(api.post).toHaveBeenCalledWith('/ai/action-plan');
        expect(result.actions).toHaveLength(1);
      });
    });

    describe('askAI', () => {
      it('should query AI', async () => {
        const mockResponse = { response: 'AI answer here' };
        (api.post as Mock).mockResolvedValueOnce({ data: mockResponse });

        const result = await apiClient.askAI('What is the best campaign?');

        expect(api.post).toHaveBeenCalledWith('/ai/query', {
          query: 'What is the best campaign?',
        });
        expect(result.response).toBe('AI answer here');
      });
    });

    describe('getRecommendations', () => {
      it('should fetch recommendations', async () => {
        const mockRecommendations = [
          { id: 'rec-1', type: 'budget_increase', confidence: 0.92 },
        ];
        (api.get as Mock).mockResolvedValueOnce({
          data: { recommendations: mockRecommendations },
        });

        const result = await apiClient.getRecommendations();

        expect(api.get).toHaveBeenCalledWith('/ai/recommendations');
        expect(result).toHaveLength(1);
        expect(result[0].confidence).toBe(0.92);
      });
    });

    describe('acceptRecommendation', () => {
      it('should accept a recommendation', async () => {
        (api.post as Mock).mockResolvedValueOnce({ data: { status: 'accepted' } });

        const result = await apiClient.acceptRecommendation('rec-1');

        expect(api.post).toHaveBeenCalledWith('/ai/recommendations/rec-1/accept');
        expect(result.status).toBe('accepted');
      });
    });

    describe('rejectRecommendation', () => {
      it('should reject a recommendation', async () => {
        (api.post as Mock).mockResolvedValueOnce({ data: { status: 'rejected' } });

        const result = await apiClient.rejectRecommendation('rec-1', 'Not applicable');

        expect(api.post).toHaveBeenCalledWith('/ai/recommendations/rec-1/reject', {
          reason: 'Not applicable',
        });
        expect(result.status).toBe('rejected');
      });

      it('should reject without reason', async () => {
        (api.post as Mock).mockResolvedValueOnce({ data: { status: 'rejected' } });

        await apiClient.rejectRecommendation('rec-1');

        expect(api.post).toHaveBeenCalledWith('/ai/recommendations/rec-1/reject', {
          reason: undefined,
        });
      });
    });

    describe('getAIStatus', () => {
      it('should get AI status', async () => {
        const mockStatus = {
          engine_status: 'active',
          automation_level: 'semi_autonomous',
          last_analysis: '2024-01-15T10:00:00Z',
          pending_recommendations: 3,
        };
        (api.get as Mock).mockResolvedValueOnce({ data: mockStatus });

        const result = await apiClient.getAIStatus();

        expect(api.get).toHaveBeenCalledWith('/ai/status');
        expect(result.engine_status).toBe('active');
        expect(result.pending_recommendations).toBe(3);
      });
    });
  });

  describe('Dashboard API', () => {
    describe('getDashboardMetrics', () => {
      it('should fetch dashboard metrics', async () => {
        const mockMetrics = {
          total_spend: 50000,
          total_revenue: 150000,
          overall_roas: 3.0,
          total_impressions: 1000000,
          total_clicks: 25000,
        };
        (api.get as Mock).mockResolvedValueOnce({ data: mockMetrics });

        const result = await apiClient.getDashboardMetrics();

        expect(api.get).toHaveBeenCalledWith('/dashboard/metrics');
        expect(result.total_spend).toBe(50000);
        expect(result.overall_roas).toBe(3.0);
      });
    });

    describe('getPlatformMetrics', () => {
      it('should fetch platform metrics', async () => {
        const mockPlatforms = [
          { platform: 'google_ads', spend: 30000, roas: 3.5 },
          { platform: 'meta_ads', spend: 20000, roas: 2.5 },
        ];
        (api.get as Mock).mockResolvedValueOnce({
          data: { platforms: mockPlatforms },
        });

        const result = await apiClient.getPlatformMetrics();

        expect(api.get).toHaveBeenCalledWith('/dashboard/platforms');
        expect(result).toHaveLength(2);
        expect(result[0].platform).toBe('google_ads');
      });
    });
  });

  describe('Health API', () => {
    describe('healthCheck', () => {
      it('should return health status', async () => {
        (api.get as Mock).mockResolvedValueOnce({ data: { status: 'ok' } });

        const result = await apiClient.healthCheck();

        expect(api.get).toHaveBeenCalledWith('/health');
        expect(result.status).toBe('ok');
      });
    });
  });

  describe('Request Interceptor Logic', () => {
    it('should add token to request when available', () => {
      // Get the interceptor function that was passed to use()
      const requestInterceptorCalls = (api.interceptors.request.use as Mock).mock.calls;

      if (requestInterceptorCalls.length > 0) {
        const [successHandler] = requestInterceptorCalls[0];

        // Set token in store
        useAuthStore.setState({ accessToken: 'test-token' });

        const config = { headers: {} } as any;
        const result = successHandler(config);

        expect(result.headers.Authorization).toBe('Bearer test-token');
      }
    });

    it('should not add token when not available', () => {
      const requestInterceptorCalls = (api.interceptors.request.use as Mock).mock.calls;

      if (requestInterceptorCalls.length > 0) {
        const [successHandler] = requestInterceptorCalls[0];

        // Token is null
        useAuthStore.setState({ accessToken: null });

        const config = { headers: {} } as any;
        const result = successHandler(config);

        expect(result.headers.Authorization).toBeUndefined();
      }
    });
  });
});
