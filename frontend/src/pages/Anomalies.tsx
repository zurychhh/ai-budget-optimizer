import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAnomalyDetection } from '@/hooks/useQueries';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { getPlatformDisplayName, getSeverityColor } from '@/lib/utils';

export function Anomalies() {
  const { data: anomalyData, isLoading, refetch } = useAnomalyDetection();

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'SPIKE':
        return <TrendingUp className="h-5 w-5" />;
      case 'DROP':
        return <TrendingDown className="h-5 w-5" />;
      case 'PACING_ISSUE':
        return <Clock className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const severityVariant = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anomaly Detection</h1>
          <p className="text-gray-500">
            AI-detected anomalies in your campaign performance
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  anomalyData?.overall_status === 'NORMAL'
                    ? '#dcfce7'
                    : anomalyData?.overall_status === 'CRITICAL'
                      ? '#fee2e2'
                      : '#fef3c7',
              }}
            >
              <AlertTriangle
                className="h-5 w-5"
                style={{
                  color:
                    anomalyData?.overall_status === 'NORMAL'
                      ? '#16a34a'
                      : anomalyData?.overall_status === 'CRITICAL'
                        ? '#dc2626'
                        : '#d97706',
                }}
              />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {anomalyData?.overall_status || 'Checking...'}
              </p>
              <p className="text-sm text-gray-500">{anomalyData?.summary}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {anomalyData?.healthy_campaigns || 0}
              </p>
              <p className="text-xs text-gray-500">Healthy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {anomalyData?.anomalous_campaigns || 0}
              </p>
              <p className="text-xs text-gray-500">Anomalous</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomalies List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : anomalyData?.anomalies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <p className="mt-4 text-lg font-medium text-gray-900">
              No anomalies detected
            </p>
            <p className="text-gray-500">
              All campaigns are performing within normal parameters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {anomalyData?.anomalies.map((anomaly) => (
            <Card key={anomaly.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${getSeverityColor(anomaly.severity)}20`,
                      color: getSeverityColor(anomaly.severity),
                    }}
                  >
                    {getAnomalyIcon(anomaly.anomaly_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={severityVariant(anomaly.severity)}>
                        {anomaly.severity}
                      </Badge>
                      <Badge variant="outline">{anomaly.anomaly_type}</Badge>
                      <Badge variant="secondary">
                        {getPlatformDisplayName(anomaly.platform)}
                      </Badge>
                    </div>
                    <p className="font-medium text-gray-900">
                      {anomaly.description}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Campaign: {anomaly.campaign_id} | Metric: {anomaly.metric}
                    </p>

                    <div className="mt-3 grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-gray-500">Current Value</p>
                        <p className="font-medium text-gray-900">
                          {anomaly.current_value.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Expected Value</p>
                        <p className="font-medium text-gray-900">
                          {anomaly.expected_value.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Deviation</p>
                        <p className="font-medium text-red-600">
                          {anomaly.deviation_percent > 0 ? '+' : ''}
                          {anomaly.deviation_percent.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Recommended Action
                      </p>
                      <p className="text-sm text-gray-700">
                        {anomaly.recommended_action}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Urgency: {anomaly.urgency_hours}h</span>
                      </div>
                      {anomaly.auto_actionable && (
                        <Button size="sm">Auto-fix</Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
