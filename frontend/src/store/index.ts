import { create } from 'zustand';
import type {
  Campaign,
  PerformanceAnalysis,
  Recommendation,
  Alert,
  Platform,
} from '@/types';

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Selected platform filter
  selectedPlatform: Platform | 'all';
  setSelectedPlatform: (platform: Platform | 'all') => void;

  // Campaigns
  campaigns: Campaign[];
  setCampaigns: (campaigns: Campaign[]) => void;
  selectedCampaignIds: string[];
  toggleCampaignSelection: (id: string) => void;
  clearCampaignSelection: () => void;

  // Analysis
  latestAnalysis: PerformanceAnalysis | null;
  setLatestAnalysis: (analysis: PerformanceAnalysis | null) => void;

  // Recommendations
  pendingRecommendations: Recommendation[];
  setPendingRecommendations: (recommendations: Recommendation[]) => void;
  removeRecommendation: (id: string) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;

  // AI Chat
  chatOpen: boolean;
  toggleChat: () => void;
  chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  clearChat: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Selected platform
  selectedPlatform: 'all',
  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),

  // Campaigns
  campaigns: [],
  setCampaigns: (campaigns) => set({ campaigns }),
  selectedCampaignIds: [],
  toggleCampaignSelection: (id) =>
    set((state) => ({
      selectedCampaignIds: state.selectedCampaignIds.includes(id)
        ? state.selectedCampaignIds.filter((cid) => cid !== id)
        : [...state.selectedCampaignIds, id],
    })),
  clearCampaignSelection: () => set({ selectedCampaignIds: [] }),

  // Analysis
  latestAnalysis: null,
  setLatestAnalysis: (analysis) => set({ latestAnalysis: analysis }),

  // Recommendations
  pendingRecommendations: [],
  setPendingRecommendations: (recommendations) => set({ pendingRecommendations: recommendations }),
  removeRecommendation: (id) =>
    set((state) => ({
      pendingRecommendations: state.pendingRecommendations.filter((r) => r.id !== id),
    })),

  // Alerts
  alerts: [],
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  acknowledgeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    })),
  clearAlerts: () => set({ alerts: [] }),

  // AI Chat
  chatOpen: false,
  toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
  chatMessages: [],
  addChatMessage: (role, content) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, { role, content }],
    })),
  clearChat: () => set({ chatMessages: [] }),
}));
