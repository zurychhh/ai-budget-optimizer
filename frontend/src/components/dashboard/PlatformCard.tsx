import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPlatformDisplayName, formatCurrency, formatRoas } from '@/lib/utils';
import type { PlatformMetrics } from '@/types';

interface PlatformCardProps {
  platform: PlatformMetrics;
}

export function PlatformCard({ platform }: PlatformCardProps) {
  const statusVariant =
    platform.status === 'connected'
      ? 'success'
      : platform.status === 'error'
        ? 'danger'
        : 'secondary';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <PlatformIcon platform={platform.platform} />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {getPlatformDisplayName(platform.platform)}
            </p>
            <p className="text-sm text-gray-500">
              {platform.campaigns} campaigns
            </p>
          </div>
        </div>
        <Badge variant={statusVariant}>
          {platform.status}
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-500">Spend</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(platform.spend)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(platform.revenue)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">ROAS</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatRoas(platform.roas)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  // Simple text-based icons for now
  const initials: Record<string, string> = {
    google_ads: 'G',
    meta_ads: 'M',
    tiktok_ads: 'T',
    linkedin_ads: 'L',
  };
  return (
    <span className="text-sm font-bold text-gray-600">
      {initials[platform] || '?'}
    </span>
  );
}
