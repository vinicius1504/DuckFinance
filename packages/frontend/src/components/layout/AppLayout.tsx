import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { BottomNav } from './BottomNav.js';
import { Header } from './Header.js';
import { useSidebarStore } from '../../stores/sidebar.store.js';

export function AppLayout() {
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className={`flex flex-col h-dvh transition-all duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-[var(--sidebar-width)]'}`}>
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 flex flex-col">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
