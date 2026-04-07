import { AlertTriangle } from 'lucide-react';
import { Button } from './Button.js';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title = 'Confirmar',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] shadow-2xl p-5">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 p-2 rounded-full ${
            variant === 'danger' ? 'bg-[var(--danger)]/15 text-[var(--danger)]' : 'bg-[var(--warning)]/15 text-[var(--warning)]'
          }`}>
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 cursor-pointer ${
              variant === 'danger'
                ? 'bg-[var(--danger)] hover:bg-[var(--danger)]/80'
                : 'bg-[var(--warning)] hover:bg-[var(--warning)]/80'
            }`}
          >
            {isPending ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
