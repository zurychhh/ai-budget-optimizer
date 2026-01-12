import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getHealthColor } from '@/lib/utils';
import type { PerformanceAnalysis } from '@/types';

interface HealthIndicatorProps {
  analysis: PerformanceAnalysis | null;
  isLoading: boolean;
}

export function HealthIndicator({ analysis, isLoading }: HealthIndicatorProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-gray-500 py-8">
            No analysis available
          </p>
        </CardContent>
      </Card>
    );
  }

  const healthColor = getHealthColor(analysis.overall_health);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Score Circle */}
          <div className="relative h-32 w-32">
            <svg className="h-32 w-32 -rotate-90 transform">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={healthColor}
                strokeWidth="12"
                strokeDasharray={`${(analysis.health_score / 100) * 352} 352`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">
                {analysis.health_score}
              </span>
              <span className="text-xs text-gray-500">/ 100</span>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1">
            <div
              className="mb-2 inline-block rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: healthColor }}
            >
              {analysis.overall_health}
            </div>
            <p className="text-sm text-gray-600">{analysis.summary}</p>
            <p className="mt-2 text-xs text-gray-400">
              Analyzed {analysis.campaign_count} campaigns
            </p>
          </div>
        </div>

        {/* Top Performers */}
        {analysis.top_performers.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900">
              Top Performers
            </h4>
            <div className="space-y-2">
              {analysis.top_performers.slice(0, 3).map((performer) => (
                <div
                  key={performer.campaign_id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">{performer.campaign_id}</span>
                  <span className="font-medium text-green-600">
                    {performer.roas.toFixed(2)}x ROAS
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
