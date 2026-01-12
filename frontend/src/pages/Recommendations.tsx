import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecommendationCard } from '@/components/recommendations';
import {
  useRecommendations,
  useAcceptRecommendation,
  useRejectRecommendation,
  useAIStatus,
} from '@/hooks/useQueries';
import { Sparkles, RefreshCw, Filter, CheckCircle2, XCircle } from 'lucide-react';
import type { Priority } from '@/types';

export function Recommendations() {
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  const { data: recommendations = [], isLoading, refetch } = useRecommendations();
  const { data: aiStatus } = useAIStatus();
  const acceptMutation = useAcceptRecommendation();
  const rejectMutation = useRejectRecommendation();

  const filteredRecommendations =
    priorityFilter === 'all'
      ? recommendations
      : recommendations.filter((r) => r.priority === priorityFilter);

  const priorityCounts = {
    HIGH: recommendations.filter((r) => r.priority === 'HIGH').length,
    MEDIUM: recommendations.filter((r) => r.priority === 'MEDIUM').length,
    LOW: recommendations.filter((r) => r.priority === 'LOW').length,
  };

  const handleAccept = (id: string) => {
    acceptMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate({ recommendationId: id });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Recommendations</h1>
          <p className="text-gray-500">
            AI-powered suggestions to optimize your campaigns
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* AI Status Card */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
              <Sparkles className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">AI Engine Status</p>
              <p className="text-sm text-gray-500">
                {aiStatus?.automation_level || 'Semi-autonomous'} mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {recommendations.length}
              </p>
              <p className="text-xs text-gray-500">pending actions</p>
            </div>
            <Badge
              variant={
                aiStatus?.engine_status === 'healthy' ? 'success' : 'warning'
              }
            >
              {aiStatus?.engine_status || 'Active'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">Filter by priority:</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={priorityFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setPriorityFilter('all')}
          >
            All ({recommendations.length})
          </Button>
          <Button
            size="sm"
            variant={priorityFilter === 'HIGH' ? 'destructive' : 'outline'}
            onClick={() => setPriorityFilter('HIGH')}
          >
            High ({priorityCounts.HIGH})
          </Button>
          <Button
            size="sm"
            variant={priorityFilter === 'MEDIUM' ? 'default' : 'outline'}
            onClick={() => setPriorityFilter('MEDIUM')}
            className={priorityFilter === 'MEDIUM' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
          >
            Medium ({priorityCounts.MEDIUM})
          </Button>
          <Button
            size="sm"
            variant={priorityFilter === 'LOW' ? 'secondary' : 'outline'}
            onClick={() => setPriorityFilter('LOW')}
          >
            Low ({priorityCounts.LOW})
          </Button>
        </div>
      </div>

      {/* Recommendations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              All caught up!
            </p>
            <p className="text-gray-500">
              No pending recommendations at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onAccept={handleAccept}
              onReject={handleReject}
              isAccepting={acceptMutation.isPending}
              isRejecting={rejectMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {filteredRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bulk Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button variant="success" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Accept All High Confidence
            </Button>
            <Button variant="outline" className="gap-2 text-red-600 hover:bg-red-50">
              <XCircle className="h-4 w-4" />
              Reject All Low Priority
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
