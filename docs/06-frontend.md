# Frontend Architecture

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **React 18+** | UI Framework |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI Components |
| **Recharts / ApexCharts** | Data visualization |
| **Zustand** | State management |
| **TanStack Query** | Data fetching & caching |

## Key Screens

### A. Dashboard Overview

```
┌────────────────────────────────────────────────────────┐
│  Marketing Budget Optimizer                            │
├────────────────────────────────────────────────────────┤
│  Total Spend: $45,234  |  ROAS: 3.2x  |  ROI: 220%    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Google Ads   │  │  Meta Ads    │  │ TikTok Ads  │  │
│  │ $15,000      │  │  $12,500     │  │ $8,500      │  │
│  │ ROAS: 3.5x   │  │  ROAS: 2.8x  │  │ ROAS: 4.1x  │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                        │
│  🤖 AI Recommendations (3)                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. Increase TikTok budget by $2,000 (High ROI)   │  │
│  │ 2. Pause Google Campaign "XYZ" (Low ROAS)        │  │
│  │ 3. Shift $1,500 from Meta to TikTok              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [Performance Chart - Last 30 Days]                    │
│  [Platform Comparison]                                 │
│  [Budget Allocation Pie Chart]                         │
└────────────────────────────────────────────────────────┘
```

### B. AI Optimization Center

Features:
- Real-time recommendations
- Scenario planning tool
- "What-if" budget simulations
- Auto-apply recommendations toggle
- AI action history & reasoning

### C. Campaign Management

Features:
- Multi-platform campaign list
- Bulk edit capabilities
- Quick budget adjustments
- Performance filters
- Search & sort

### D. Natural Language Chat Interface

```
┌─────────────────────────────────────────────────────────────┐
│  💬 CHAT WITH AI                                            │
│  ───────────────────────────────────────────────────────   │
│  You: Which campaigns have the best ROAS this month?       │
│                                                             │
│  🤖 AI: Here are your top 5 campaigns by ROAS:             │
│  1. TikTok "Viral Series" - ROAS 5.2x                      │
│  2. Google "Brand Search" - ROAS 4.8x                      │
│  3. Meta "Retargeting" - ROAS 4.1x                         │
│  ...                                                        │
│                                                             │
│  You: Increase TikTok budget by 20%                        │
│                                                             │
│  🤖 AI: Done! TikTok "Viral Series" budget increased       │
│  from $1,500 to $1,800. Changes are now live.              │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│  [Type your question or command...]                        │
│                                                             │
│  Examples:                                                  │
│  • "Show me underperforming campaigns"                     │
│  • "What's our best performing platform?"                  │
│  • "Create a report for last week"                         │
│  • "Pause all campaigns with ROAS below 2"                 │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

```
mbo-frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── dashboard/
│   │   │   ├── BudgetOverview.tsx
│   │   │   ├── PlatformCards.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   └── AIActivityFeed.tsx
│   │   ├── campaigns/
│   │   │   ├── CampaignList.tsx
│   │   │   ├── CampaignCard.tsx
│   │   │   └── BudgetEditor.tsx
│   │   ├── ai/
│   │   │   ├── RecommendationsList.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   └── ScenarioPlanner.tsx
│   │   ├── alerts/
│   │   │   ├── AlertBanner.tsx
│   │   │   └── AlertsList.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Campaigns.tsx
│   │   ├── AICenter.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   │
│   ├── services/
│   │   ├── api.ts                 # API client
│   │   ├── campaigns.ts           # Campaign service
│   │   ├── analytics.ts           # Analytics service
│   │   └── ai.ts                  # AI service
│   │
│   ├── stores/
│   │   ├── campaignStore.ts       # Zustand store
│   │   ├── alertStore.ts
│   │   └── userStore.ts
│   │
│   ├── hooks/
│   │   ├── useCampaigns.ts        # TanStack Query hooks
│   │   ├── useAnalytics.ts
│   │   └── useAIRecommendations.ts
│   │
│   ├── types/
│   │   ├── campaign.ts
│   │   ├── metrics.ts
│   │   └── ai.ts
│   │
│   └── App.tsx
│
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## API Integration

### API Client

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### TanStack Query Hooks

```typescript
// hooks/useCampaigns.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => api.get('/campaigns', { params: filters }).then(r => r.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, newBudget }: { campaignId: string; newBudget: number }) =>
      api.post(`/campaigns/${campaignId}/budget`, { new_budget: newBudget }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
```

### Zustand Store

```typescript
// stores/campaignStore.ts
import { create } from 'zustand';

interface CampaignStore {
  selectedPlatforms: string[];
  dateRange: { start: Date; end: Date };
  setSelectedPlatforms: (platforms: string[]) => void;
  setDateRange: (range: { start: Date; end: Date }) => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  selectedPlatforms: ['google_ads', 'meta_ads', 'tiktok_ads'],
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  setSelectedPlatforms: (platforms) => set({ selectedPlatforms: platforms }),
  setDateRange: (range) => set({ dateRange: range }),
}));
```

## Real-time Updates

Using WebSockets for real-time dashboard updates:

```typescript
// hooks/useRealTimeUpdates.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealTimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'CAMPAIGN_UPDATE':
          queryClient.invalidateQueries({ queryKey: ['campaigns'] });
          break;
        case 'AI_ACTION':
          queryClient.invalidateQueries({ queryKey: ['ai-actions'] });
          break;
        case 'NEW_ALERT':
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
          break;
      }
    };

    return () => ws.close();
  }, [queryClient]);
}
```

## Related Documents

- [Architecture](./02-architecture.md) - Backend integration
- [AI Integration](./03-ai-integration.md) - Chat interface backend
