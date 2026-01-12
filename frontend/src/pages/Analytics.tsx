import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500">
          Detailed performance analytics across all platforms
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="h-16 w-16 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-900">
            Analytics Dashboard
          </p>
          <p className="text-gray-500">
            Advanced analytics and reporting coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
