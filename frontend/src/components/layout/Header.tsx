import { Menu, Bell, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';

export function Header() {
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const toggleChat = useStore((state) => state.toggleChat);
  const alerts = useStore((state) => state.alerts);

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900">
          Marketing Budget Optimizer
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* AI Chat */}
        <Button variant="outline" size="sm" onClick={toggleChat} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Ask AI
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unacknowledgedAlerts > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unacknowledgedAlerts}
            </span>
          )}
        </Button>

        {/* User */}
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
