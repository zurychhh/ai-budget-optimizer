import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCampaigns, useBudgetOptimization } from '@/hooks/useQueries';
import {
  formatCurrency,
  formatRoas,
  getPlatformDisplayName,
} from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BudgetOptimizer() {
  const [totalBudget, setTotalBudget] = useState(50000);
  const [optimizationGoal, setOptimizationGoal] = useState('maximize_roas');
  const [runOptimization, setRunOptimization] = useState(false);

  const { data: campaigns = [] } = useCampaigns();
  const {
    data: optimization,
    isLoading,
    refetch,
  } = useBudgetOptimization(
    totalBudget,
    optimizationGoal,
    runOptimization
  );

  const handleOptimize = () => {
    setRunOptimization(true);
    refetch();
  };

  const currentTotalBudget = campaigns.reduce((sum, c) => sum + c.budget_usd, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Budget Optimizer</h1>
        <p className="text-gray-500">
          AI-powered budget allocation across your campaigns
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Settings</CardTitle>
          <CardDescription>
            Configure your budget and optimization goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Total Budget */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Total Budget
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Current allocation: {formatCurrency(currentTotalBudget)}
              </p>
            </div>

            {/* Optimization Goal */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Optimization Goal
              </label>
              <select
                value={optimizationGoal}
                onChange={(e) => setOptimizationGoal(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="maximize_roas">Maximize ROAS</option>
                <option value="maximize_conversions">Maximize Conversions</option>
                <option value="maximize_revenue">Maximize Revenue</option>
                <option value="minimize_cpa">Minimize CPA</option>
              </select>
            </div>

            {/* Run Button */}
            <div className="flex items-end">
              <Button
                onClick={handleOptimize}
                disabled={isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Run AI Optimization
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {optimization && (
        <>
          {/* Projected Improvement */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    ROAS Improvement
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-green-700">
                  +{optimization.projected_improvement.roas_improvement_percent.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-gray-500">New ROAS</div>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatRoas(optimization.projected_improvement.new_overall_roas)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-gray-500">
                  Additional Revenue
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(optimization.projected_improvement.additional_revenue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-gray-500">
                  Additional Conversions
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  +{optimization.projected_improvement.additional_conversions}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Recommendations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Budget Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <th className="pb-3 pr-4">Campaign</th>
                      <th className="pb-3 pr-4">Platform</th>
                      <th className="pb-3 pr-4 text-right">Current</th>
                      <th className="pb-3 pr-4 text-center">Change</th>
                      <th className="pb-3 pr-4 text-right">Recommended</th>
                      <th className="pb-3 pr-4 text-right">ROAS Impact</th>
                      <th className="pb-3 pr-4">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {optimization.recommendations.map((rec) => (
                      <tr key={rec.campaign_id} className="text-sm">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-gray-900">
                            {rec.campaign_name}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline">
                            {getPlatformDisplayName(rec.platform)}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {formatCurrency(rec.current_budget)}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={cn(
                                'text-sm font-medium',
                                rec.change_percent > 0
                                  ? 'text-green-600'
                                  : rec.change_percent < 0
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                              )}
                            >
                              {rec.change_percent > 0 ? '+' : ''}
                              {rec.change_percent.toFixed(0)}%
                            </span>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right font-medium">
                          {formatCurrency(rec.recommended_budget)}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="text-green-600">
                            +{rec.expected_roas_impact.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full bg-primary-500"
                                style={{ width: `${rec.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {Math.round(rec.confidence * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Risks */}
          {optimization.risks.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-5 w-5" />
                  Potential Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm text-yellow-700">
                  {optimization.risks.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Apply Button */}
          <div className="flex justify-end">
            <Button size="lg" className="gap-2">
              <Play className="h-4 w-4" />
              Apply All Recommendations
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
