import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.js';
import { LoginPage } from './pages/Login.js';
import { DashboardPage } from './pages/Dashboard.js';
import { AccountsPage } from './pages/Accounts.js';
import { TransactionsPage } from './pages/Transactions.js';
import { CategoriesPage } from './pages/Categories.js';
import { ChatPage } from './pages/Chat.js';
import { BudgetsPage } from './pages/Budgets.js';
import { ReportsPage } from './pages/Reports.js';
import { AlertsPage } from './pages/Alerts.js';
import { SettingsPage } from './pages/Settings.js';
import { useAuthStore } from './stores/auth.store.js';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
