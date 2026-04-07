import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  MessageCircle,
  BarChart3,
} from 'lucide-react';

const items = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/accounts', icon: Wallet, label: 'Contas' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transacoes' },
  { to: '/chat', icon: MessageCircle, label: 'DuckAI' },
  { to: '/reports', icon: BarChart3, label: 'Mais' },
];

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex justify-around py-2">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
              isActive
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            }`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
