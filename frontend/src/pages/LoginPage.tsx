import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 mb-4">
            <span className="font-display font-bold text-accent text-xl">Z</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Zorvyn FinanceOps</h1>
          <p className="text-text-secondary text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@zorvyn.com"
                required
                className="input"
              />
            </div>

            <div>
              <label className="label block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input"
              />
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Spinner size="sm" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-4 card-sm">
          <p className="label text-center mb-3">Demo Accounts</p>
          <div className="space-y-1.5">
            {[
              { role: 'ADMIN', email: 'admin@zorvyn.com', pwd: 'Password123', color: 'text-accent' },
              { role: 'ANALYST', email: 'analyst@zorvyn.com', pwd: 'Password123', color: 'text-purple-400' },
              { role: 'VIEWER', email: 'viewer@zorvyn.com', pwd: 'Password123', color: 'text-text-secondary' },
            ].map(({ role, email: e, pwd, color }) => (
              <button
                key={role}
                onClick={() => demoLogin(e, pwd)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors text-left group"
              >
                <div>
                  <span className={`text-xs font-medium ${color}`}>{role}</span>
                  <p className="text-[11px] text-text-muted font-mono">{e}</p>
                </div>
                <span className="text-text-muted text-xs opacity-0 group-hover:opacity-100 transition-opacity">fill →</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-muted text-center mt-2">Password: Password123</p>
        </div>
      </div>
    </div>
  );
};
