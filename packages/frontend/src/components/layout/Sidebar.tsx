import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  MessageCircle,
  Target,
  BarChart3,
  Bell,
  Tag,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store.js';
import { useSidebarStore } from '../../stores/sidebar.store.js';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Wallet, label: 'Contas' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transacoes' },
  { to: '/chat', icon: MessageCircle, label: 'DuckAI' },
  { to: '/budgets', icon: Target, label: 'Orcamentos' },
  { to: '/reports', icon: BarChart3, label: 'Relatorios' },
  { to: '/alerts', icon: Bell, label: 'Alertas' },
  { to: '/categories', icon: Tag, label: 'Categorias' },
  { to: '/settings', icon: Settings, label: 'Configuracoes' },
];

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  const { collapsed, toggle } = useSidebarStore();

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] fixed left-0 top-0 z-40 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[var(--sidebar-width)]'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-[var(--border-color)] ${collapsed ? 'justify-center px-2 py-5' : 'gap-3 px-6 py-5'}`}>
        <img src="/duck.svg" alt="DuckFinance" className="w-8 h-8 shrink-0" />
        {!collapsed && <span className="text-xl font-bold text-[var(--accent)] whitespace-nowrap overflow-hidden">DuckFinance</span>}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? 'px-1.5' : 'px-3'}`}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-lg text-sm transition-colors ${
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && <span className="whitespace-nowrap overflow-hidden">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-[var(--border-color)] p-2 space-y-1">
        {/* Toggle */}
        <button
          onClick={toggle}
          className={`flex items-center rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors w-full cursor-pointer ${
            collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
          }`}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          {!collapsed && <span>Recolher</span>}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className={`flex items-center rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors w-full cursor-pointer ${
            collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
          }`}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
