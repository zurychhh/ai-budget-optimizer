import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as api from '@/api/client';
import {
  useCampaigns,
  useCampaignPerformance,
  usePerformanceAnalysis,
  useBudgetOptimization,
  useAnomalyDetection,
  useActionPlan,
  useRecommendations,
  useAIStatus,
  useDashboardMetrics,
  usePlatformMetrics,
  usePauseCampaign,
  useResumeCampaign,
  useUpdateBudget,
  useAcceptRecommendation,
  useRejectRecommendation,
  useAskAI,
} from './useQueries';

// Mock API
vi.mock('@/api/client', () => ({
  getCampaigns: vi.fn(),
  getCampaignPerformance: vi.fn(),
  analyzePerformance: vi.fn(),
  optimizeBudget: vi.fn(),
  detectAnomalies: vi.fn(),
  getActionPlan: vi.fn(),
  getRecommendations: vi.fn(),
  getAIStatus: vi.fn(),
  getDashboardMetrics: vi.fn(),
  getPlatformMetrics: vi.fn(),
  pauseCampaign: vi.fn(),
  resumeCampaign: vi.fn(),
  updateBudget: vi.fn(),
  acceptRecommendation: vi.fn(),
  rejectRecommendation: vi.fn(),
  askAI: vi.fn(),
}));

// Wrapper for react-query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useQueries Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Campaign Queries', () => {
    describe('useCampaigns', () => {
      it('should fetch campaigns', async () => {
        const mockCampaigns = [
          { campaign_id: '1', campaign_name: 'Test Campaign' },
        ];
        vi.mocked(api.getCampaigns).mockResolvedValueOnce(mockCampaigns);

        const { result } = renderHook(() => useCampaigns(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockCampaigns);
        expect(api.getCampaigns).toHaveBeenCalledWith(undefined);
      });

      it('should fetch campaigns for specific platform', async () => {
        const mockCampaigns = [
          { campaign_id: '1', platform: 'google_ads' },
        ];
        vi.mocked(api.getCampaigns).mockResolvedValueOnce(mockCampaigns);

        const { result } = renderHook(() => useCampaigns('google_ads'), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(api.getCampaigns).toHaveBeenCalledWith('google_ads');
      });
    });

    describe('useCampaignPerformance', () => {
      it('should fetch campaign performance', async () => {
        const mockData = { campaigns: [], count: 0 };
        vi.mocked(api.getCampaignPerformance).mockResolvedValueOnce(mockData);

        const { result } = renderHook(
          () => useCampaignPerformance('google_ads', '2024-01-01', '2024-01-07'),
          { wrapper: createWrapper() }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(api.getCampaignPerformance).toHaveBeenCalledWith(
          'google_ads',
          '2024-01-01',
          '2024-01-07'
        );
      });

      it('should not fetch when disabled', async () => {
        renderHook(
          () => useCampaignPerformance('google_ads', '2024-01-01', '2024-01-07', false),
          { wrapper: createWrapper() }
        );

        expect(api.getCampaignPerformance).not.toHaveBeenCalled();
      });
    });
  });

  describe('AI Queries', () => {
    describe('usePerformanceAnalysis', () => {
      it('should fetch performance analysis', async () => {
        const mockAnalysis = { summary: 'Good performance' };
        vi.mocked(api.analyzePerformance).mockResolvedValueOnce(mockAnalysis);

        const { result } = renderHook(() => usePerformanceAnalysis(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockAnalysis);
      });
    });

    describe('useBudgetOptimization', () => {
      it('should fetch budget optimization', async () => {
        const mockOptimization = { allocations: [], expected_improvement: 10 };
        vi.mocked(api.optimizeBudget).mockResolvedValueOnce(mockOptimization);

        const { result } = renderHook(
          () => useBudgetOptimization(10000, 'maximize_roas'),
          { wrapper: createWrapper() }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(api.optimizeBudget).toHaveBeenCalledWith(10000, 'maximize_roas');
      });

      it('should not fetch when disabled', async () => {
        renderHook(
          () => useBudgetOptimization(10000, 'maximize_roas', false),
          { wrapper: createWrapper() }
        );

        expect(api.optimizeBudget).not.toHaveBeenCalled();
      });
    });

    describe('useAnomalyDetection', () => {
      it('should fetch anomalies', async () => {
        const mockAnomalies = { anomalies: [], summary: 'No anomalies' };
        vi.mocked(api.detectAnomalies).mockResolvedValueOnce(mockAnomalies);

        const { result } = renderHook(() => useAnomalyDetection(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockAnomalies);
      });
    });

    describe('useActionPlan', () => {
      it('should fetch action plan', async () => {
        const mockPlan = { actions: [] };
        vi.mocked(api.getActionPlan).mockResolvedValueOnce(mockPlan);

        const { result } = renderHook(() => useActionPlan(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockPlan);
      });
    });

    describe('useRecommendations', () => {
      it('should fetch recommendations', async () => {
        const mockRecommendations = [{ id: '1', type: 'budget_increase' }];
        vi.mocked(api.getRecommendations).mockResolvedValueOnce(mockRecommendations);

        const { result } = renderHook(() => useRecommendations(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockRecommendations);
      });
    });

    describe('useAIStatus', () => {
      it('should fetch AI status', async () => {
        const mockStatus = {
          engine_status: 'active',
          pending_recommendations: 3,
        };
        vi.mocked(api.getAIStatus).mockResolvedValueOnce(mockStatus);

        const { result } = renderHook(() => useAIStatus(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockStatus);
      });
    });
  });

  describe('Dashboard Queries', () => {
    describe('useDashboardMetrics', () => {
      it('should fetch dashboard metrics', async () => {
        const mockMetrics = { total_spend: 50000, overall_roas: 3.0 };
        vi.mocked(api.getDashboardMetrics).mockResolvedValueOnce(mockMetrics);

        const { result } = renderHook(() => useDashboardMetrics(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockMetrics);
      });
    });

    describe('usePlatformMetrics', () => {
      it('should fetch platform metrics', async () => {
        const mockMetrics = [{ platform: 'google_ads', spend: 30000 }];
        vi.mocked(api.getPlatformMetrics).mockResolvedValueOnce(mockMetrics);

        const { result } = renderHook(() => usePlatformMetrics(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockMetrics);
      });
    });
  });

  describe('Mutations', () => {
    describe('usePauseCampaign', () => {
      it('should pause campaign', async () => {
        vi.mocked(api.pauseCampaign).mockResolvedValueOnce({ success: true });

        const { result } = renderHook(() => usePauseCampaign(), {
          wrapper: createWrapper(),
        });

        result.current.mutate({ platform: 'google_ads', campaignId: '123' });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(api.pauseCampaign).toHaveBeenCalledWith('google_ads', '123');
      });
    });

    describe('useResumeCampaign', () => {
      it('should resume campaign', async () => {
        vi.mocked(api.resumeCampaign).mockResolvedValueOnce({ success: true });

        const { result } = renderHook(() => useResumeCampaign(), {
          wrapper: createWrapper(),
        });

        result.current.mutate({ platform: 'meta_ads', campaignId: '456' });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(api.resumeCampaign).toHaveBeenCalledWith('meta_ads', '456');
      });
    });

    describe('useUpdateBudget', () => {
      it('should update budget', async () => {
        vi.mocked(api.updateBudget).mockResolvedValueOnce({ success: true });

        const { result } = renderHook(() => useUpdateBudget(), {
          wrapper: createWrapper(),
        });

        result.current.mutate({
          platform: 'google_ads',
          campaignId: '123',
          newBudget: 500,
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(api.updateBudget).toHaveBeenCalledWith('google_ads', '123', 500);
      });
    });

    describe('useAcceptRecommendation', () => {
      it('should accept recommendation', async () => {
        vi.mocked(api.acceptRecommendation).mockResolvedValueOnce({ status: 'accepted' });

        const { result } = renderHook(() => useAcceptRecommendation(), {
          wrapper: createWrapper(),
        });

        result.current.mutate('rec-123');

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(api.acceptRecommendation).toHaveBeenCalledWith('rec-123');
      });
    });

    describe('useRejectRecommendation', () => {
      it('should reject recommendation with reason', async () => {
        vi.mocked(api.rejectRecommendation).mockResolvedValueOnce({ status: 'rejected' });

        const { result } = renderHook(() => useRejectRecommendation(), {
          wrapper: createWrapper(),
        });

        result.current.mutate({
          recommendationId: 'rec-456',
          reason: 'Not applicable',
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(api.rejectRecommendation).toHaveBeenCalledWith('rec-456', 'Not applicable');
      });
    });

    describe('useAskAI', () => {
      it('should ask AI', async () => {
        vi.mocked(api.askAI).mockResolvedValueOnce({ response: 'AI response' });

        const { result } = renderHook(() => useAskAI(), {
          wrapper: createWrapper(),
        });

        result.current.mutate('What is the best campaign?');

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(api.askAI).toHaveBeenCalledWith('What is the best campaign?');
        expect(result.current.data).toEqual({ response: 'AI response' });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle query errors', async () => {
      vi.mocked(api.getCampaigns).mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useCampaigns(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should handle mutation errors', async () => {
      vi.mocked(api.pauseCampaign).mockRejectedValueOnce(new Error('Pause failed'));

      const { result } = renderHook(() => usePauseCampaign(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ platform: 'google_ads', campaignId: '123' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
