import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useState } from 'react';
import { getPlatformDisplayName } from '@/lib/utils';
import type { Recommendation } from '@/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

export function RecommendationCard({
  recommendation,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const priorityVariant =
    recommendation.priority === 'HIGH'
      ? 'danger'
      : recommendation.priority === 'MEDIUM'
        ? 'warning'
        : 'secondary';

  const actionTypeLabels: Record<string, string> = {
    budget_increase: 'Increase Budget',
    budget_decrease: 'Decrease Budget',
    pause_campaign: 'Pause Campaign',
    resume_campaign: 'Resume Campaign',
    reallocate_budget: 'Reallocate Budget',
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={priorityVariant}>{recommendation.priority}</Badge>
              <Badge variant="outline">
                {actionTypeLabels[recommendation.action_type] || recommendation.action_type}
              </Badge>
              {recommendation.auto_execute && (
                <Badge variant="success" className="gap-1">
                  <Zap className="h-3 w-3" />
                  Auto
                </Badge>
              )}
            </div>
            <p className="font-medium text-gray-900">{recommendation.description}</p>
            <p className="mt-1 text-sm text-gray-500">
              {getPlatformDisplayName(recommendation.platform)} - Campaign{' '}
              {recommendation.campaign_id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {Math.round(recommendation.confidence * 100)}%
              </p>
              <p className="text-xs text-gray-500">confidence</p>
            </div>
          </div>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex w-full items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show details
            </>
          )}
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">Reasoning</p>
              <p className="mt-1 text-sm text-gray-700">{recommendation.reasoning}</p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Expected Impact
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {recommendation.estimated_impact.change_percent > 0 ? '+' : ''}
                  {recommendation.estimated_impact.change_percent}%{' '}
                  {recommendation.estimated_impact.metric}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex border-t border-gray-100">
        <Button
          variant="ghost"
          className="flex-1 rounded-none border-r border-gray-100 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => onReject(recommendation.id)}
          disabled={isRejecting}
        >
          <X className="mr-2 h-4 w-4" />
          Reject
        </Button>
        <Button
          variant="ghost"
          className="flex-1 rounded-none text-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={() => onAccept(recommendation.id)}
          disabled={isAccepting}
        >
          <Check className="mr-2 h-4 w-4" />
          Accept
        </Button>
      </div>
    </Card>
  );
}
