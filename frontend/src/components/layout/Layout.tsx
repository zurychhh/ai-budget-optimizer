import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIChat } from './AIChat';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

export function Layout() {
  const sidebarOpen = useStore((state) => state.sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
      <AIChat />
    </div>
  );
}
