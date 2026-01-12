import { DollarSign, TrendingUp, MousePointerClick, Target } from 'lucide-react';
import {
  MetricCard,
  PlatformCard,
  CampaignTable,
  HealthIndicator,
} from '@/components/dashboard';
import { useCampaigns, usePerformanceAnalysis, usePauseCampaign, useResumeCampaign } from '@/hooks/useQueries';
import { formatCurrency, formatNumber, formatRoas } from '@/lib/utils';
import type { Campaign, PlatformMetrics } from '@/types';

// Mock platform metrics for now
const mockPlatformMetrics: PlatformMetrics[] = [
  { platform: 'google_ads', campaigns: 12, spend: 15420, revenue: 45800, roas: 2.97, status: 'connected' },
  { platform: 'meta_ads', campaigns: 8, spend: 8950, revenue: 22400, roas: 2.50, status: 'connected' },
  { platform: 'tiktok_ads', campaigns: 5, spend: 4200, revenue: 9800, roas: 2.33, status: 'connected' },
  { platform: 'linkedin_ads', campaigns: 3, spend: 2800, revenue: 5600, roas: 2.00, status: 'connected' },
];

export function Dashboard() {
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();
  const { data: analysis, isLoading: analysisLoading } = usePerformanceAnalysis();
  const pauseCampaign = usePauseCampaign();
  const resumeCampaign = useResumeCampaign();

  // Calculate totals from campaigns
  const totalSpend = campaigns.reduce((sum, c) => sum + c.cost_usd, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue_usd, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const overallRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const handlePause = (campaign: Campaign) => {
    pauseCampaign.mutate({
      platform: campaign.platform,
      campaignId: campaign.campaign_id,
    });
  };

  const handleResume = (campaign: Campaign) => {
    resumeCampaign.mutate({
      platform: campaign.platform,
      campaignId: campaign.campaign_id,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Overview of your marketing performance across all platforms
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Spend"
          value={formatCurrency(totalSpend)}
          change={12.5}
          icon={DollarSign}
          iconColor="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={18.2}
          icon={TrendingUp}
          iconColor="bg-green-100 text-green-600"
        />
        <MetricCard
          title="Total Clicks"
          value={formatNumber(totalClicks)}
          change={-3.4}
          icon={MousePointerClick}
          iconColor="bg-purple-100 text-purple-600"
        />
        <MetricCard
          title="Overall ROAS"
          value={formatRoas(overallRoas)}
          change={5.8}
          icon={Target}
          iconColor="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Platform Overview & Health */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Platforms</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockPlatformMetrics.map((platform) => (
              <PlatformCard key={platform.platform} platform={platform} />
            ))}
          </div>
        </div>

        {/* Health Indicator */}
        <HealthIndicator analysis={analysis ?? null} isLoading={analysisLoading} />
      </div>

      {/* Campaign Table */}
      {campaignsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : (
        <CampaignTable
          campaigns={campaigns}
          onPause={handlePause}
          onResume={handleResume}
        />
      )}
    </div>
  );
}
