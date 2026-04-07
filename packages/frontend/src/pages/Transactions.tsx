import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, X, Check, RefreshCw, Calendar, Wallet, Tag, FileText, CreditCard, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { Modal } from '../components/ui/Modal.js';
import { ConfirmModal } from '../components/ui/ConfirmModal.js';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions.js';
import { useAccounts } from '../hooks/useAccounts.js';
import { useCategories } from '../hooks/useCategories.js';
import type { Transaction, CreateTransactionRequest, UpdateTransactionRequest, TransactionFilters } from '@duckfinance/shared';

const typeLabels: Record<string, string> = {
  income: 'Receita',
  expense: 'Despesa',
  transfer: 'Transferencia',
};

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 20 });
  const { data: txData, isLoading } = useTransactions(filters);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState<UpdateTransactionRequest>({});
  const [createForm, setCreateForm] = useState<CreateTransactionRequest>({
    accountId: '',
    type: 'expense',
    amount: 0,
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getAccountName = (id: string) => accounts?.find((a) => a.id === id)?.name || '—';
  const getCategoryName = (id: string | null) => {
    if (!id) return '—';
    return categories?.find((c) => c.id === id)?.name || '—';
  };

  // --- Create ---
  const openCreate = () => {
    setCreateForm({
      accountId: accounts?.[0]?.id || '',
      type: 'expense',
      amount: 0,
      description: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setCreateModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTx.mutateAsync(createForm);
      setCreateModalOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao criar transação');
    }
  };

  // --- Detail / Edit ---
  const openDetail = (tx: Transaction) => {
    setDetailTx(tx);
    setIsEditing(false);
  };

  const startEdit = () => {
    if (!detailTx) return;
    setEditForm({
      description: detailTx.description,
      type: detailTx.type,
      amount: Number(detailTx.amount),
      date: detailTx.date.slice(0, 10),
      accountId: detailTx.accountId,
      categoryId: detailTx.categoryId || undefined,
      isPaid: detailTx.isPaid,
      isRecurring: detailTx.isRecurring,
      notes: detailTx.notes || undefined,
    });
    setIsEditing(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailTx) return;
    await updateTx.mutateAsync({ id: detailTx.id, data: editForm });
    setDetailTx(null);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!detailTx) return;
    await deleteTx.mutateAsync(detailTx.id);
    setConfirmDeleteOpen(false);
    setDetailTx(null);
  };

  if (isLoading) {
    return <div className="text-[var(--text-secondary)]">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Transacoes</h1>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={16} /> Nova
        </Button>
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap gap-3">
        <Select
          value={filters.type || ''}
          onChange={(e) => setFilters({ ...filters, type: e.target.value as TransactionFilters['type'] || undefined, page: 1 })}
          options={[
            { value: '', label: 'Todos os tipos' },
            { value: 'income', label: 'Receita' },
            { value: 'expense', label: 'Despesa' },
            { value: 'transfer', label: 'Transferencia' },
          ]}
        />
        <Input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined, page: 1 })}
          placeholder="Data inicio"
        />
        <Input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined, page: 1 })}
          placeholder="Data fim"
        />
        <Input
          value={filters.search || ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined, page: 1 })}
          placeholder="Buscar..."
        />
      </Card>

      {/* Transaction list */}
      <Card>
        {txData?.data && txData.data.length > 0 ? (
          <div className="space-y-1">
            {txData.data.map((tx) => (
              <button
                key={tx.id}
                onClick={() => openDetail(tx)}
                className="flex items-center justify-between w-full py-3 px-2 rounded-lg border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{tx.description}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                    {!tx.isPaid && ' — Pendente'}
                    {tx.categoryId && ` — ${getCategoryName(tx.categoryId)}`}
                  </p>
                </div>
                {tx.type === 'transfer' ? (
                  <div className="flex flex-col items-end ml-3">
                    <span className="text-sm font-semibold whitespace-nowrap text-[var(--accent)]">
                      {formatCurrency(Number(tx.amount))}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                      {getAccountName(tx.accountId)} <ArrowRight size={10} /> {tx.toAccountId ? getAccountName(tx.toAccountId) : '—'}
                    </span>
                  </div>
                ) : (
                  <span className={`text-sm font-semibold whitespace-nowrap ml-3 ${tx.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--text-muted)] py-8">Nenhuma transacao encontrada</p>
        )}

        {/* Pagination */}
        {txData && txData.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
            <Button
              variant="ghost"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
            >
              Anterior
            </Button>
            <span className="text-sm text-[var(--text-secondary)] flex items-center">
              {filters.page || 1} / {txData.totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={(filters.page || 1) >= txData.totalPages}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
            >
              Proximo
            </Button>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Nova Transacao">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Descricao"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            placeholder="Ex: Mercado"
            required
          />
          <Select
            label="Tipo"
            value={createForm.type}
            onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as CreateTransactionRequest['type'] })}
            options={[
              { value: 'expense', label: 'Despesa' },
              { value: 'income', label: 'Receita' },
              { value: 'transfer', label: 'Transferencia' },
            ]}
          />
          <Input
            label="Valor"
            type="number"
            step="0.01"
            min="0.01"
            value={createForm.amount || ''}
            onChange={(e) => setCreateForm({ ...createForm, amount: Number(e.target.value) })}
            required
          />
          <Input
            label="Data"
            type="date"
            value={createForm.date}
            onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
            required
          />
          {accounts && accounts.length > 0 && (
            <Select
              label={createForm.type === 'transfer' ? 'Conta de origem' : 'Conta'}
              value={createForm.accountId}
              onChange={(e) => setCreateForm({ ...createForm, accountId: e.target.value })}
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            />
          )}
          {createForm.type === 'transfer' && accounts && accounts.length > 0 && (
            <Select
              label="Conta de destino"
              value={createForm.toAccountId || ''}
              onChange={(e) => setCreateForm({ ...createForm, toAccountId: e.target.value || undefined })}
              options={[
                { value: '', label: 'Selecione...' },
                ...accounts.filter((a) => a.id !== createForm.accountId).map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          )}
          {createForm.type !== 'transfer' && categories && categories.length > 0 && (
            <Select
              label="Categoria"
              value={createForm.categoryId || ''}
              onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value || undefined })}
              options={[
                { value: '', label: 'Sem categoria' },
                ...categories
                  .filter((c) => c.type === createForm.type)
                  .map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTx.isPending}>
              Criar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail / Edit Modal */}
      <Modal
        isOpen={!!detailTx}
        onClose={() => { setDetailTx(null); setIsEditing(false); }}
        title={isEditing ? 'Editar Transacao' : 'Detalhes da Transacao'}
      >
        {detailTx && !isEditing && (
          <div className="space-y-4">
            {/* Detail rows */}
            <div className="space-y-3">
              <DetailRow icon={<FileText size={16} />} label="Descricao" value={detailTx.description} />
              <DetailRow
                icon={<Tag size={16} />}
                label="Tipo"
                value={
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    detailTx.type === 'income'
                      ? 'bg-[var(--success)]/15 text-[var(--success)]'
                      : detailTx.type === 'expense'
                        ? 'bg-[var(--danger)]/15 text-[var(--danger)]'
                        : 'bg-[var(--accent)]/15 text-[var(--accent)]'
                  }`}>
                    {typeLabels[detailTx.type]}
                  </span>
                }
              />
              <DetailRow
                icon={<CreditCard size={16} />}
                label="Valor"
                value={
                  <span className={`font-semibold ${
                    detailTx.type === 'income' ? 'text-[var(--success)]'
                    : detailTx.type === 'expense' ? 'text-[var(--danger)]'
                    : 'text-[var(--accent)]'
                  }`}>
                    {detailTx.type === 'income' ? '+' : detailTx.type === 'expense' ? '-' : ''}{formatCurrency(Number(detailTx.amount))}
                  </span>
                }
              />
              <DetailRow icon={<Calendar size={16} />} label="Data" value={new Date(detailTx.date).toLocaleDateString('pt-BR')} />
              {detailTx.type === 'transfer' ? (
                <DetailRow
                  icon={<Wallet size={16} />}
                  label="Transferência"
                  value={
                    <span className="flex items-center gap-2">
                      {getAccountName(detailTx.accountId)}
                      <ArrowRight size={14} className="text-[var(--text-muted)]" />
                      {detailTx.toAccountId ? getAccountName(detailTx.toAccountId) : '—'}
                    </span>
                  }
                />
              ) : (
                <>
                  <DetailRow icon={<Wallet size={16} />} label="Conta" value={getAccountName(detailTx.accountId)} />
                  <DetailRow icon={<Tag size={16} />} label="Categoria" value={getCategoryName(detailTx.categoryId)} />
                </>
              )}
              <DetailRow
                icon={<Check size={16} />}
                label="Status"
                value={
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    detailTx.isPaid
                      ? 'bg-[var(--success)]/15 text-[var(--success)]'
                      : 'bg-[var(--warning)]/15 text-[var(--warning)]'
                  }`}>
                    {detailTx.isPaid ? 'Pago' : 'Pendente'}
                  </span>
                }
              />
              {detailTx.isRecurring && (
                <DetailRow icon={<RefreshCw size={16} />} label="Recorrente" value="Sim" />
              )}
              {detailTx.notes && (
                <DetailRow icon={<FileText size={16} />} label="Notas" value={detailTx.notes} />
              )}
              <div className="pt-1 border-t border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-muted)]">
                  Criado em {new Date(detailTx.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmDeleteOpen(true)}
                className="text-[var(--danger)] hover:bg-[var(--danger)]/10 flex items-center gap-2"
              >
                <Trash2 size={14} /> Excluir
              </Button>
              <Button onClick={startEdit} className="flex items-center gap-2">
                <Pencil size={14} /> Editar
              </Button>
            </div>
          </div>
        )}

        {detailTx && isEditing && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Descricao"
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              required
            />
            <Select
              label="Tipo"
              value={editForm.type || 'expense'}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value as CreateTransactionRequest['type'] })}
              options={[
                { value: 'expense', label: 'Despesa' },
                { value: 'income', label: 'Receita' },
                { value: 'transfer', label: 'Transferencia' },
              ]}
            />
            <Input
              label="Valor"
              type="number"
              step="0.01"
              min="0.01"
              value={editForm.amount || ''}
              onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
              required
            />
            <Input
              label="Data"
              type="date"
              value={editForm.date || ''}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              required
            />
            {accounts && accounts.length > 0 && (
              <Select
                label="Conta"
                value={editForm.accountId || ''}
                onChange={(e) => setEditForm({ ...editForm, accountId: e.target.value })}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              />
            )}
            {categories && categories.length > 0 && (
              <Select
                label="Categoria"
                value={editForm.categoryId || ''}
                onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value || undefined })}
                options={[
                  { value: '', label: 'Sem categoria' },
                  ...categories
                    .filter((c) => c.type === editForm.type || editForm.type === 'transfer')
                    .map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isPaid ?? false}
                  onChange={(e) => setEditForm({ ...editForm, isPaid: e.target.checked })}
                  className="accent-[var(--accent)]"
                />
                Pago
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isRecurring ?? false}
                  onChange={(e) => setEditForm({ ...editForm, isRecurring: e.target.checked })}
                  className="accent-[var(--accent)]"
                />
                Recorrente
              </label>
            </div>
            <Input
              label="Notas"
              value={editForm.notes || ''}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value || undefined })}
              placeholder="Observacoes (opcional)"
            />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" type="button" onClick={() => setIsEditing(false)}>
                <X size={14} className="mr-1 inline" /> Cancelar
              </Button>
              <Button type="submit" disabled={updateTx.isPending}>
                <Check size={14} className="mr-1 inline" /> Salvar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Excluir transacao"
        message={`Tem certeza que deseja excluir "${detailTx?.description}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        isPending={deleteTx.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[var(--text-muted)] mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <div className="text-sm text-[var(--text-primary)] break-words">{value}</div>
      </div>
    </div>
  );
}
