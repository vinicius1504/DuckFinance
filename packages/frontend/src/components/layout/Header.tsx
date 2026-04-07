import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { useUnreadAlertCount } from '../../hooks/useAlerts.js';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data: unreadData } = useUnreadAlertCount();
  const unreadCount = unreadData?.count || 0;

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-secondary)]/80 backdrop-blur-md border-b border-[var(--border-color)] px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <img src="/duck.svg" alt="DuckFinance" className="w-7 h-7" />
          <span className="text-lg font-bold text-[var(--accent)]">DuckFinance</span>
        </div>

        {/* Desktop spacer */}
        <div className="hidden lg:block" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => navigate('/alerts')}
            className="relative p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--danger)] text-white text-[10px] font-bold px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-black text-sm font-bold ml-1">
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      </div>
    </header>
  );
}
