import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card.js';
import { ThemeToggle } from '../components/ui/ThemeToggle.js';
import { useAuthStore } from '../stores/auth.store.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { ConfirmModal } from '../components/ui/ConfirmModal.js';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { whatsappApi, subscriptionApi } from '../api/endpoints.js';
import { User, Crown, Smartphone, QrCode, Wifi, WifiOff, RefreshCw, LogOut, CreditCard, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

type Tab = 'profile' | 'connections';

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Configuracoes</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-tertiary)]">
        <TabButton active={tab === 'profile'} onClick={() => setTab('profile')} icon={<User size={16} />} label="Perfil" />
        <TabButton active={tab === 'connections'} onClick={() => setTab('connections')} icon={<Smartphone size={16} />} label="Conexoes" />
      </div>

      {tab === 'profile' ? <ProfileTab /> : <ConnectionsTab />}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-[var(--bg-secondary)] text-[var(--accent)] shadow-sm'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Profile Tab ───────────────────────────────────────────

function ProfileTab() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Dados Pessoais</h2>
        <div className="space-y-2">
          <p className="text-sm text-[var(--text-secondary)]">Nome: <span className="text-[var(--text-primary)]">{user?.name}</span></p>
          <p className="text-sm text-[var(--text-secondary)]">Email: <span className="text-[var(--text-primary)]">{user?.email}</span></p>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Aparencia</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">Tema</span>
          <ThemeToggle />
        </div>
      </Card>

      {/* Subscription */}
      <SubscriptionCard />

      {/* Logout */}
      <Card>
        <Button variant="danger" onClick={handleLogout} className="w-full">
          Sair da conta
        </Button>
      </Card>
    </div>
  );
}

// ─── Subscription Card ────────────────────────────────────

const planLabels: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  premium: 'Premium',
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Ativa', color: 'var(--success)', icon: CheckCircle },
  canceled: { label: 'Cancelada', color: 'var(--warning)', icon: AlertTriangle },
  past_due: { label: 'Inadimplente', color: 'var(--danger)', icon: AlertTriangle },
  revoked: { label: 'Revogada', color: 'var(--danger)', icon: XCircle },
};

function SubscriptionCard() {
  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.get(),
  });

  const checkoutMutation = useMutation({
    mutationFn: () => subscriptionApi.checkout(),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const isFree = !sub || sub.plan === 'free';
  const config = statusConfig[sub?.status || 'active'] || statusConfig.active;
  const StatusIcon = config.icon;

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Crown size={20} className="text-[var(--accent)]" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Assinatura</h2>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Carregando...</p>
      ) : isFree ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Plano Gratuito</p>
              <p className="text-xs text-[var(--text-muted)]">Funcionalidades basicas</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)]">
              Free
            </span>
          </div>
          <div className="p-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5">
            <p className="text-sm font-medium text-[var(--accent)] mb-1">Upgrade para Pro</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              DuckAI ilimitado, WhatsApp bot, relatorios avancados e mais.
            </p>
            <Button
              size="sm"
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              className="flex items-center gap-2"
            >
              <CreditCard size={14} /> {checkoutMutation.isPending ? 'Redirecionando...' : 'Assinar agora'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Plano {planLabels[sub.plan] || sub.plan}
              </p>
              {sub.expiresAt && (
                <p className="text-xs text-[var(--text-muted)]">
                  {sub.status === 'canceled' ? 'Acesso ate' : 'Proxima renovacao'}:{' '}
                  {new Date(sub.expiresAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent)]/15 text-[var(--accent)]">
              {planLabels[sub.plan] || sub.plan}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)]">
            <StatusIcon size={14} style={{ color: config.color }} />
            <span className="text-xs font-medium" style={{ color: config.color }}>
              {config.label}
            </span>
            {sub.currentPeriod > 0 && (
              <span className="text-xs text-[var(--text-muted)] ml-auto">
                Periodo {sub.currentPeriod}
              </span>
            )}
          </div>

          {sub.status === 'canceled' && (
            <div className="p-3 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/5">
              <p className="text-xs text-[var(--text-secondary)]">
                Sua assinatura foi cancelada. Voce ainda tem acesso ate a data de expiracao.
              </p>
            </div>
          )}

          {sub.status === 'past_due' && (
            <div className="p-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5">
              <p className="text-xs text-[var(--text-secondary)]">
                Houve um problema com a renovacao. Atualize seu meio de pagamento.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Connections Tab ──────────────────────────────────────

function ConnectionsTab() {
  const qc = useQueryClient();
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);

  const linkCodeMutation = useMutation({
    mutationFn: () => whatsappApi.generateLinkCode(),
    onSuccess: (data) => setLinkCode(data.code),
  });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Smartphone size={20} className="text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">WhatsApp</h2>
        </div>

        <div className="space-y-4">
          {/* QR Code connection */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Conexao via QR Code</p>
              <p className="text-xs text-[var(--text-muted)]">Conecte sua instancia do WhatsApp</p>
            </div>
            <Button size="sm" onClick={() => setQrModalOpen(true)} className="flex items-center gap-2">
              <QrCode size={14} /> Conectar
            </Button>
          </div>

          {/* Link code */}
          <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Vincular Grupo</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Gere um codigo e envie no grupo do WhatsApp para vincular ao DuckAI.
            </p>

            {linkCode ? (
              <div className="space-y-3">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 text-center">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Seu codigo de vinculo</p>
                  <p className="text-3xl font-mono font-bold text-[var(--accent)] tracking-widest">{linkCode}</p>
                </div>
                <div className="text-xs text-[var(--text-secondary)] space-y-1">
                  <p>Envie no grupo do WhatsApp:</p>
                  <code className="block bg-[var(--bg-secondary)] px-3 py-2 rounded text-[var(--accent)]">
                    /duck vincular {linkCode}
                  </code>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => linkCodeMutation.mutate()}
                  disabled={linkCodeMutation.isPending}
                >
                  Gerar novo codigo
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => linkCodeMutation.mutate()}
                disabled={linkCodeMutation.isPending}
              >
                {linkCodeMutation.isPending ? 'Gerando...' : 'Gerar codigo de vinculo'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* QR Code Modal */}
      {qrModalOpen && (
        <QrCodeModal
          onClose={() => setQrModalOpen(false)}
          onDisconnect={() => { setQrModalOpen(false); setDisconnectConfirm(true); }}
        />
      )}

      <ConfirmModal
        isOpen={disconnectConfirm}
        title="Desconectar WhatsApp"
        message="Tem certeza que deseja desconectar o WhatsApp? O bot deixara de funcionar ate reconectar."
        confirmLabel="Desconectar"
        variant="warning"
        onConfirm={async () => {
          await whatsappApi.logout();
          setDisconnectConfirm(false);
          qc.invalidateQueries({ queryKey: ['whatsapp-status'] });
        }}
        onCancel={() => setDisconnectConfirm(false)}
      />
    </div>
  );
}

// ─── QR Code Modal ────────────────────────────────────────

function QrCodeModal({ onClose, onDisconnect }: { onClose: () => void; onDisconnect: () => void }) {
  const [qrData, setQrData] = useState<{ qrcode: string | null; connected: boolean; state: string; instanceName?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQr = async () => {
    try {
      setError(false);
      const data = await whatsappApi.qrcode();
      setQrData(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const data = await whatsappApi.status();
      if (data.connected) {
        setQrData((prev) => ({ ...prev, qrcode: null, connected: true, state: 'open', instanceName: data.instanceName }));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchQr();
    intervalRef.current = setInterval(checkStatus, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (qrData?.connected && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [qrData?.connected]);

  const handleRefresh = () => { setLoading(true); fetchQr(); };
  const handleRestart = async () => { setLoading(true); await whatsappApi.restart(); setTimeout(fetchQr, 2000); };

  const stateLabel: Record<string, string> = {
    open: 'Conectado', close: 'Desconectado', connecting: 'Conectando...',
    not_found: 'Criando instancia...', qrcode: 'Aguardando leitura', error: 'Erro',
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Conexao WhatsApp">
      <div className="space-y-4">
        {qrData?.instanceName && !loading && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-xs">
            <span className="text-[var(--text-muted)]">Instancia</span>
            <span className="font-mono text-[var(--text-primary)]">{qrData.instanceName}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <RefreshCw size={32} className="text-[var(--accent)] animate-spin" />
            <p className="text-sm text-[var(--text-muted)]">
              {qrData?.state === 'not_found' ? 'Criando instancia...' : 'Carregando...'}
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <WifiOff size={32} className="text-[var(--danger)]" />
            <p className="text-sm text-[var(--text-secondary)]">Nao foi possivel conectar a Evolution API</p>
            <Button size="sm" onClick={handleRestart} className="flex items-center gap-2">
              <RefreshCw size={14} /> Reiniciar instancia
            </Button>
          </div>
        ) : qrData?.connected ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="p-3 rounded-full bg-[var(--success)]/15">
              <Wifi size={32} className="text-[var(--success)]" />
            </div>
            <p className="text-base font-semibold text-[var(--success)]">Conectado</p>
            <p className="text-sm text-[var(--text-muted)] text-center">Sua instancia do WhatsApp esta ativa e funcionando.</p>
            <Button variant="secondary" size="sm" onClick={onDisconnect} className="flex items-center gap-2 mt-2">
              <LogOut size={14} /> Desconectar
            </Button>
          </div>
        ) : qrData?.qrcode ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)]/10">
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-xs font-medium text-[var(--accent)]">{stateLabel[qrData.state] || qrData.state}</span>
            </div>
            <div className="bg-white p-3 rounded-xl">
              <img src={qrData.qrcode} alt="QR Code WhatsApp" className="w-64 h-64" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">Escaneie o QR Code</p>
              <p className="text-xs text-[var(--text-muted)]">Abra o WhatsApp &rarr; Dispositivos vinculados &rarr; Vincular dispositivo</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw size={14} /> Atualizar QR Code
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <QrCode size={32} className="text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)]">Nao foi possivel gerar o QR Code</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleRefresh} className="flex items-center gap-2">
                <RefreshCw size={14} /> Tentar novamente
              </Button>
              <Button size="sm" variant="secondary" onClick={handleRestart} className="flex items-center gap-2">
                Reiniciar instancia
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
