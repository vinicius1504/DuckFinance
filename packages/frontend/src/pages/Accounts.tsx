import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { Modal } from '../components/ui/Modal.js';
import { ConfirmModal } from '../components/ui/ConfirmModal.js';
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '../hooks/useAccounts.js';
import type { Account, CreateAccountRequest } from '@duckfinance/shared';

const accountTypeOptions = [
  { value: 'checking', label: 'Conta Corrente' },
  { value: 'savings', label: 'Poupanca' },
  { value: 'investment', label: 'Investimento' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'other', label: 'Outro' },
];

const defaultForm: CreateAccountRequest = {
  name: '',
  type: 'checking',
  balance: 0,
  color: '#FFD700',
  institution: '',
};

export function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const totalBalance = accounts?.reduce((sum, a) => sum + Number(a.balance), 0) || 0;

  const openCreate = () => {
    setEditingAccount(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({
      name: account.name,
      type: account.type as CreateAccountRequest['type'],
      balance: 0,
      color: account.color,
      institution: account.institution || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      await updateAccount.mutateAsync({ id: editingAccount.id, data: form });
    } else {
      await createAccount.mutateAsync(form);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteAccount.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return <div className="text-[var(--text-secondary)]">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Contas</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Saldo total: <span className="font-semibold text-[var(--accent)]">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={16} /> Nova Conta
        </Button>
      </div>

      {accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: account.color }} />
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{account.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {accountTypeOptions.find((o) => o.value === account.type)?.label}
                      {account.institution && ` - ${account.institution}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(account)} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-pointer">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(account)} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {formatCurrency(Number(account.balance))}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-[var(--text-muted)] mb-4">Nenhuma conta cadastrada</p>
          <Button onClick={openCreate}>Criar primeira conta</Button>
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? 'Editar Conta' : 'Nova Conta'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Nubank"
            required
          />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as CreateAccountRequest['type'] })}
            options={accountTypeOptions}
          />
          <Input
            label="Instituicao"
            value={form.institution || ''}
            onChange={(e) => setForm({ ...form, institution: e.target.value })}
            placeholder="Ex: Nubank, Itau"
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
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAccount.isPending || updateAccount.isPending}>
              {editingAccount ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Excluir conta"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todas as transacoes desta conta serao afetadas.`}
        confirmLabel="Excluir"
        isPending={deleteAccount.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
