import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../components/ui/Card.js';
import { useAccounts } from '../hooks/useAccounts.js';
import { useTransactions } from '../hooks/useTransactions.js';
import { useMonthlyStats, useMonthlyHistory } from '../hooks/useDashboard.js';
import { useBudgets } from '../hooks/useBudgets.js';

const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const { data: txData, isLoading: loadingTx } = useTransactions({ limit: 5 });
  const { data: stats } = useMonthlyStats(month, year);
  const { data: history } = useMonthlyHistory(6);
  const { data: budgets } = useBudgets(month, year);
  const totalBalance = accounts?.reduce((sum, a) => sum + Number(a.balance), 0) || 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loadingAccounts || loadingTx) {
    return <div className="text-[var(--text-secondary)]">Carregando...</div>;
  }

  const historyData = history?.map((h) => ({
    name: `${MONTH_NAMES_SHORT[h.month - 1]}/${String(h.year).slice(2)}`,
    Receita: h.income,
    Despesa: h.expense,
  })) || [];

  const pieData = stats?.spendingByCategory?.map((s) => ({
    name: s.categoryName,
    value: s.total,
    color: s.categoryColor,
  })) || [];

  const budgetsInAlert = budgets?.filter((b) => b.percentage >= 80) || [];
  const totalBudgeted = budgets?.reduce((sum, b) => sum + b.budget.amount, 0) || 0;
  const totalBudgetSpent = budgets?.reduce((sum, b) => sum + b.budget.spent, 0) || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[var(--accent)]/10">
            <Wallet className="text-[var(--accent)]" size={24} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Saldo Total</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{formatCurrency(totalBalance)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[var(--success)]/10">
            <TrendingUp className="text-[var(--success)]" size={24} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Receitas (mes)</p>
            <p className="text-xl font-bold text-[var(--success)]">{formatCurrency(stats?.totalIncome || 0)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[var(--danger)]/10">
            <TrendingDown className="text-[var(--danger)]" size={24} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Despesas (mes)</p>
            <p className="text-xl font-bold text-[var(--danger)]">{formatCurrency(stats?.totalExpense || 0)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10">
            <ArrowLeftRight className="text-blue-500" size={24} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Restante (mes)</p>
            {(() => {
              const remaining = (stats?.totalIncome || 0) - (stats?.totalExpense || 0);
              return (
                <p className={`text-xl font-bold ${remaining >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {formatCurrency(remaining)}
                </p>
              );
            })()}
          </div>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Spending by category */}
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Gastos por Categoria</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">Sem dados para este mes</p>
          )}
        </Card>

        {/* Bar Chart - Monthly history */}
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Receita vs Despesa (6 meses)</h2>
          {historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={historyData}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Receita" fill="var(--success)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesa" fill="var(--danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">Sem dados historicos</p>
          )}
        </Card>
      </div>

      {/* Budget summary */}
      {budgets && budgets.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Resumo de Orcamentos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Orcado</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(totalBudgeted)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Gasto</p>
              <p className="text-lg font-bold text-[var(--danger)]">{formatCurrency(totalBudgetSpent)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Em alerta</p>
              <p className="text-lg font-bold text-[var(--accent)]">{budgetsInAlert.length}</p>
            </div>
          </div>
          {budgetsInAlert.length > 0 && (
            <div className="space-y-2">
              {budgetsInAlert.map((b) => (
                <div key={b.budget.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.categoryColor }} />
                    <span className="text-[var(--text-secondary)]">{b.categoryName}</span>
                  </div>
                  <span className={`font-medium ${b.percentage >= 100 ? 'text-[var(--danger)]' : 'text-yellow-500'}`}>
                    {b.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Transacoes Recentes</h2>
        {txData?.data && txData.data.length > 0 ? (
          <div className="space-y-3">
            {txData.data.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{tx.description}</p>
                  <p className="text-xs text-[var(--text-muted)]">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Nenhuma transacao ainda</p>
        )}
      </Card>

      {/* Accounts Overview */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Suas Contas</h2>
        {accounts && accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{acc.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{acc.institution || acc.type}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {formatCurrency(Number(acc.balance))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Nenhuma conta cadastrada</p>
        )}
      </Card>
    </div>
  );
}
