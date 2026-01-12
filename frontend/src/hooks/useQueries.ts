import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/client';
import type { Platform } from '@/types';

// Campaign queries
export function useCampaigns(platform?: Platform) {
  return useQuery({
    queryKey: ['campaigns', platform],
    queryFn: () => api.getCampaigns(platform),
  });
}

export function useCampaignPerformance(
  platform: Platform,
  startDate: string,
  endDate: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['campaignPerformance', platform, startDate, endDate],
    queryFn: () => api.getCampaignPerformance(platform, startDate, endDate),
    enabled,
  });
}

// AI queries
export function usePerformanceAnalysis() {
  return useQuery({
    queryKey: ['analysis'],
    queryFn: () => api.analyzePerformance(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBudgetOptimization(
  totalBudget: number,
  optimizationGoal: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['budgetOptimization', totalBudget, optimizationGoal],
    queryFn: () => api.optimizeBudget(totalBudget, optimizationGoal),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnomalyDetection() {
  return useQuery({
    queryKey: ['anomalies'],
    queryFn: () => api.detectAnomalies(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActionPlan() {
  return useQuery({
    queryKey: ['actionPlan'],
    queryFn: () => api.getActionPlan(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: () => api.getRecommendations(),
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useAIStatus() {
  return useQuery({
    queryKey: ['aiStatus'],
    queryFn: () => api.getAIStatus(),
    refetchInterval: 30 * 1000,
  });
}

// Dashboard queries
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: () => api.getDashboardMetrics(),
    refetchInterval: 60 * 1000,
  });
}

export function usePlatformMetrics() {
  return useQuery({
    queryKey: ['platformMetrics'],
    queryFn: () => api.getPlatformMetrics(),
    refetchInterval: 60 * 1000,
  });
}

// Mutations
export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ platform, campaignId }: { platform: Platform; campaignId: string }) =>
      api.pauseCampaign(platform, campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaignPerformance'] });
    },
  });
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ platform, campaignId }: { platform: Platform; campaignId: string }) =>
      api.resumeCampaign(platform, campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaignPerformance'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      platform,
      campaignId,
      newBudget,
    }: {
      platform: Platform;
      campaignId: string;
      newBudget: number;
    }) => api.updateBudget(platform, campaignId, newBudget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaignPerformance'] });
    },
  });
}

export function useAcceptRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recommendationId: string) => api.acceptRecommendation(recommendationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useRejectRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recommendationId, reason }: { recommendationId: string; reason?: string }) =>
      api.rejectRecommendation(recommendationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}

export function useAskAI() {
  return useMutation({
    mutationFn: (query: string) => api.askAI(query),
  });
}
