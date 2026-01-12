import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Bell, Shield, Link } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your optimization preferences</p>
      </div>

      {/* Automation Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary-600" />
            Automation Level
          </CardTitle>
          <CardDescription>
            Control how autonomous the AI optimization should be
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                level: 'advisory_only',
                name: 'Advisory Only',
                description:
                  'AI only analyzes and suggests. No automatic actions.',
                recommended: false,
              },
              {
                level: 'semi_autonomous',
                name: 'Semi-Autonomous',
                description:
                  'AI proposes actions, you approve before execution.',
                recommended: true,
              },
              {
                level: 'full_autonomous',
                name: 'Full Autonomous',
                description:
                  'AI automatically executes high-confidence (>85%) actions.',
                recommended: false,
              },
            ].map((option) => (
              <label
                key={option.level}
                className="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="automation"
                  value={option.level}
                  defaultChecked={option.level === 'semi_autonomous'}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{option.name}</p>
                    {option.recommended && (
                      <Badge variant="success">Recommended</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safety Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-600" />
            Safety Thresholds
          </CardTitle>
          <CardDescription>
            Set limits for autonomous actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confidence Threshold
              </label>
              <div className="mt-1 flex items-center gap-4">
                <input
                  type="range"
                  min="50"
                  max="99"
                  defaultValue="85"
                  className="w-full"
                />
                <span className="text-sm font-medium text-gray-900">85%</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum confidence for automatic execution
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Budget Change
              </label>
              <div className="mt-1 flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="50"
                  defaultValue="30"
                  className="w-full"
                />
                <span className="text-sm font-medium text-gray-900">30%</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Maximum budget change per action
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary-600" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure alert and notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: 'anomalies', label: 'Anomaly Alerts', defaultChecked: true },
              { id: 'recommendations', label: 'New Recommendations', defaultChecked: true },
              { id: 'executions', label: 'Auto-execution Reports', defaultChecked: true },
              { id: 'weekly', label: 'Weekly Summary', defaultChecked: false },
            ].map((notification) => (
              <label
                key={notification.id}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-700">{notification.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={notification.defaultChecked}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connected Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary-600" />
            Connected Platforms
          </CardTitle>
          <CardDescription>
            Manage your advertising platform connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Google Ads', status: 'connected' },
              { name: 'Meta Ads', status: 'connected' },
              { name: 'TikTok Ads', status: 'connected' },
              { name: 'LinkedIn Ads', status: 'connected' },
            ].map((platform) => (
              <div
                key={platform.name}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <span className="text-sm font-bold text-gray-600">
                      {platform.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{platform.name}</p>
                    <p className="text-xs text-gray-500">
                      Last synced: 5 minutes ago
                    </p>
                  </div>
                </div>
                <Badge variant="success">{platform.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  );
}
