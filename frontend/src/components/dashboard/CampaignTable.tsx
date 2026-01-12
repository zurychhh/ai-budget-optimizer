import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  formatCurrency,
  formatNumber,
  formatRoas,
  getPlatformDisplayName,
} from '@/lib/utils';
import { Pause, Play } from 'lucide-react';
import type { Campaign } from '@/types';

interface CampaignTableProps {
  campaigns: Campaign[];
  onPause?: (campaign: Campaign) => void;
  onResume?: (campaign: Campaign) => void;
}

export function CampaignTable({ campaigns, onPause, onResume }: CampaignTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Campaigns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="pb-3 pr-4">Campaign</th>
                <th className="pb-3 pr-4">Platform</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4 text-right">Budget</th>
                <th className="pb-3 pr-4 text-right">Spend</th>
                <th className="pb-3 pr-4 text-right">Clicks</th>
                <th className="pb-3 pr-4 text-right">Conv.</th>
                <th className="pb-3 pr-4 text-right">ROAS</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((campaign) => (
                <tr key={campaign.campaign_id} className="text-sm">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-gray-900">
                      {campaign.campaign_name}
                    </p>
                    <p className="text-xs text-gray-500">{campaign.campaign_id}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline">
                      {getPlatformDisplayName(campaign.platform)}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant={campaign.status === 'ENABLED' ? 'success' : 'secondary'}
                    >
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-right font-medium">
                    {formatCurrency(campaign.budget_usd)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {formatCurrency(campaign.cost_usd)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {formatNumber(campaign.clicks)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {formatNumber(campaign.conversions)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span
                      className={
                        campaign.roas >= 2
                          ? 'text-green-600'
                          : campaign.roas >= 1
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }
                    >
                      {formatRoas(campaign.roas)}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {campaign.status === 'ENABLED' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPause?.(campaign)}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResume?.(campaign)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
