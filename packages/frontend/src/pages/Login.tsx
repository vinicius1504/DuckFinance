import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { useAuthStore } from '../stores/auth.store.js';
import { authApi } from '../api/endpoints.js';

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isRegister
        ? await authApi.register({ name, email, password })
        : await authApi.login({ email, password });
      setAuth(result.token, result.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao processar requisicao');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/duck.svg" alt="DuckFinance" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[var(--accent)]">DuckFinance</h1>
          <p className="text-[var(--text-secondary)] mt-1">Suas financas sob controle</p>
        </div>

        {/* Form */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            {isRegister ? 'Criar conta' : 'Entrar'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Input
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
              minLength={6}
            />

            {error && (
              <p className="text-sm text-[var(--danger)]">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : isRegister ? 'Criar conta' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
            {isRegister ? 'Ja tem conta?' : 'Nao tem conta?'}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-[var(--accent)] hover:underline cursor-pointer"
            >
              {isRegister ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
