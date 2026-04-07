import { useState } from 'react';
import { Target, AlertTriangle, Clock, Bell, Trash2, CheckCheck } from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { ConfirmModal } from '../components/ui/ConfirmModal.js';
import { useAlerts, useMarkAlertAsRead, useMarkAllAlertsAsRead, useDeleteAlert } from '../hooks/useAlerts.js';

const ALERT_ICONS: Record<string, typeof Bell> = {
  budget_exceeded: Target,
  low_balance: AlertTriangle,
  bill_due: Clock,
  general: Bell,
};

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `ha ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `ha ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `ha ${days}d`;
  const months = Math.floor(days / 30);
  return `ha ${months} mes${months > 1 ? 'es' : ''}`;
}

export function AlertsPage() {
  const { data: alertData, isLoading } = useAlerts({ limit: 50 });
  const markAsRead = useMarkAlertAsRead();
  const markAllAsRead = useMarkAllAlertsAsRead();
  const deleteAlert = useDeleteAlert();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleMarkRead = async (id: string) => {
    await markAsRead.mutateAsync(id);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    await deleteAlert.mutateAsync(deleteTargetId);
    setDeleteTargetId(null);
  };

  const unreadCount = alertData?.data?.filter((a) => !a.isRead).length || 0;

  if (isLoading) {
    return <div className="text-[var(--text-secondary)]">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Alertas</h1>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAllAsRead.mutateAsync()} disabled={markAllAsRead.isPending} className="flex items-center gap-2">
            <CheckCheck size={14} /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {alertData?.data && alertData.data.length > 0 ? (
        <div className="space-y-2">
          {alertData.data.map((alert) => {
            const Icon = ALERT_ICONS[alert.type] || Bell;
            return (
              <Card
                key={alert.id}
                className={`flex items-start gap-3 cursor-pointer transition-colors ${!alert.isRead ? 'border-l-2 border-l-[var(--accent)]' : ''}`}
                onClick={() => !alert.isRead && handleMarkRead(alert.id)}
              >
                <div className={`p-2 rounded-lg shrink-0 ${!alert.isRead ? 'bg-[var(--accent)]/10' : 'bg-[var(--bg-tertiary)]'}`}>
                  <Icon size={18} className={!alert.isRead ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!alert.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                    <p className={`text-sm font-medium ${!alert.isRead ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {alert.title}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{alert.message}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{timeAgo(alert.triggerDate)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTargetId(alert.id); }}
                  className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Bell size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <p className="text-[var(--text-muted)]">Nenhum alerta</p>
        </Card>
      )}

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Excluir alerta"
        message="Tem certeza que deseja excluir este alerta?"
        confirmLabel="Excluir"
        isPending={deleteAlert.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
