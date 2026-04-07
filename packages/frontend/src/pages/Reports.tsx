import { useState } from 'react';
import { Download } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { useCategoryBreakdown, useCashFlow } from '../hooks/useReports.js';
import { reportsApi } from '../api/endpoints.js';

export function ReportsPage() {
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = now.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const { data: breakdown, isLoading: loadingBreakdown } = useCategoryBreakdown(startDate, endDate, 'expense');
  const { data: cashFlow, isLoading: loadingCashFlow } = useCashFlow(startDate, endDate);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleExportCsv = async () => {
    const blob = await reportsApi.exportCsv(startDate, endDate);
    const url = window.URL.createObjectURL(blob as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes_${startDate}_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const pieData = breakdown?.map((b) => ({
    name: b.categoryName,
    value: b.total,
    color: b.categoryColor,
  })) || [];

  const totalExpense = breakdown?.reduce((sum, b) => sum + b.total, 0) || 0;

  const areaData = cashFlow?.map((c) => ({
    name: new Date(c.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    Receita: c.income,
    Despesa: c.expense,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Relatorios</h1>
        <Button variant="secondary" onClick={handleExportCsv} className="flex items-center gap-2">
          <Download size={16} /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap gap-3 items-end">
        <Input
          label="Data inicio"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="Data fim"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </Card>

      {loadingBreakdown || loadingCashFlow ? (
        <div className="text-[var(--text-secondary)]">Carregando...</div>
      ) : (
        <>
          {/* Category breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Gastos por Categoria</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">Sem dados no periodo</p>
              )}
            </Card>

            {/* Category table */}
            <Card>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Detalhamento</h2>
              {breakdown && breakdown.length > 0 ? (
                <div className="space-y-2">
                  {breakdown.map((b) => (
                    <div key={b.categoryId} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.categoryColor }} />
                        <span className="text-sm text-[var(--text-primary)]">{b.categoryName}</span>
                        <span className="text-xs text-[var(--text-muted)]">({b.count})</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(b.total)}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {totalExpense > 0 ? ((b.total / totalExpense) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 font-semibold">
                    <span className="text-sm text-[var(--text-primary)]">Total</span>
                    <span className="text-sm text-[var(--danger)]">{formatCurrency(totalExpense)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">Sem dados no periodo</p>
              )}
            </Card>
          </div>

          {/* Cash flow chart */}
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Fluxo de Caixa</h2>
            {areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={areaData}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="Receita" stroke="var(--success)" fill="var(--success)" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="Despesa" stroke="var(--danger)" fill="var(--danger)" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">Sem dados no periodo</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
