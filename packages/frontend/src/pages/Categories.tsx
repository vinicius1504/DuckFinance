import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { Modal } from '../components/ui/Modal.js';
import { ConfirmModal } from '../components/ui/ConfirmModal.js';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories.js';
import type { Category, CreateCategoryRequest } from '@duckfinance/shared';

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CreateCategoryRequest>({ name: '', type: 'expense' });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'expense', icon: 'tag', color: '#FFD700' });
    setIsModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, type: cat.type as 'income' | 'expense', icon: cat.icon, color: cat.color });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateCategory.mutateAsync({ id: editing.id, data: form });
    } else {
      await createCategory.mutateAsync(form);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCategory.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) return <div className="text-[var(--text-secondary)]">Carregando...</div>;

  const expenseCategories = categories?.filter((c) => c.type === 'expense') || [];
  const incomeCategories = categories?.filter((c) => c.type === 'income') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Categorias</h1>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={16} /> Nova
        </Button>
      </div>

      {/* Expense categories */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Despesas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {expenseCategories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm text-[var(--text-primary)]">{cat.name}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-pointer">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(cat)} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Income categories */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Receitas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {incomeCategories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm text-[var(--text-primary)]">{cat.name}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-pointer">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(cat)} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Editar Categoria' : 'Nova Categoria'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'income' | 'expense' })}
            options={[
              { value: 'expense', label: 'Despesa' },
              { value: 'income', label: 'Receita' },
            ]}
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-[var(--text-secondary)]">Cor</label>
            <input
              type="color"
              value={form.color || '#FFD700'}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Excluir categoria"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        isPending={deleteCategory.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
