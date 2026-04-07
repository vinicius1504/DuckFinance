import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Copy, Pencil, Trash2, Target } from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { Modal } from '../components/ui/Modal.js';
import { ConfirmModal } from '../components/ui/ConfirmModal.js';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget, useCopyBudgets } from '../hooks/useBudgets.js';
import { useCategories } from '../hooks/useCategories.js';

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data: budgets, isLoading } = useBudgets(month, year);
  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();
  const copyBudgets = useCopyBudgets();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ categoryId: '', amount: 0 });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const openCreate = () => {
    setEditingId(null);
    const expenseCategories = categories?.filter((c) => c.type === 'expense') || [];
    setForm({ categoryId: expenseCategories[0]?.id || '', amount: 0 });
    setIsModalOpen(true);
  };

  const openEdit = (budgetId: string, amount: number) => {
    setEditingId(budgetId);
    setForm({ categoryId: '', amount });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateBudget.mutateAsync({ id: editingId, data: { amount: form.amount } });
    } else {
      await createBudget.mutateAsync({ categoryId: form.categoryId, amount: form.amount, month, year });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteBudget.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleCopy = async () => {
    await copyBudgets.mutateAsync({ month, year });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'var(--danger)';
    if (percentage >= 70) return '#EAB308';
    return 'var(--success)';
  };

  const totalBudgeted = budgets?.reduce((sum, b) => sum + b.budget.amount, 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + b.budget.spent, 0) || 0;
  const totalRemaining = totalBudgeted - totalSpent;

  // Categories available for new budget (expense only, not already budgeted)
  const budgetedCategoryIds = budgets?.map((b) => b.budget.categoryId) || [];
  const availableCategories = categories?.filter((c) => c.type === 'expense' && !budgetedCategoryIds.includes(c.id)) || [];

  if (isLoading) {
    return <div className="text-[var(--text-secondary)]">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Orcamentos</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopy} disabled={copyBudgets.isPending} className="flex items-center gap-1">
            <Copy size={14} /> Copiar mes anterior
          </Button>
          <Button onClick={openCreate} className="flex items-center gap-2" disabled={availableCategories.length === 0}>
            <Plus size={16} /> Novo
          </Button>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-pointer">
          <ChevronLeft size={20} />
        </button>
        <span className="text-lg font-semibold text-[var(--text-primary)] min-w-[180px] text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-pointer">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">Total Orcado</p>
          <p className="text-xl font-bold text-[var(--text-primary)]">{formatCurrency(totalBudgeted)}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">Total Gasto</p>
          <p className="text-xl font-bold text-[var(--danger)]">{formatCurrency(totalSpent)}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">Restante</p>
          <p className={`text-xl font-bold ${totalRemaining >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {formatCurrency(totalRemaining)}
          </p>
        </Card>
      </div>

      {/* Budget list */}
      {budgets && budgets.length > 0 ? (
        <div className="space-y-3">
          {budgets.map((bp) => (
            <Card key={bp.budget.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bp.categoryColor }} />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{bp.categoryName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(bp.budget.id, bp.budget.amount)} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-pointer">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget({ id: bp.budget.id, name: bp.categoryName })} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="w-full h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(bp.percentage, 100)}%`,
                    backgroundColor: getProgressColor(bp.percentage),
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-[var(--text-muted)]">
                  {formatCurrency(bp.budget.spent)} / {formatCurrency(bp.budget.amount)}
                </span>
                <span className="text-xs font-medium" style={{ color: getProgressColor(bp.percentage) }}>
                  {bp.percentage.toFixed(0)}%
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Target size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <p className="text-[var(--text-muted)] mb-4">Nenhum orcamento definido para este mes</p>
          <Button onClick={openCreate} disabled={availableCategories.length === 0}>
            Criar primeiro orcamento
          </Button>
        </Card>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Orcamento' : 'Novo Orcamento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingId && (
            <Select
              label="Categoria"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              options={availableCategories.map((c) => ({ value: c.id, label: c.name }))}
            />
          )}
          <Input
            label="Valor limite"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            required
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createBudget.isPending || updateBudget.isPending}>
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Excluir orcamento"
        message={`Tem certeza que deseja excluir o orcamento de "${deleteTarget?.name}"?`}
        confirmLabel="Excluir"
        isPending={deleteBudget.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
