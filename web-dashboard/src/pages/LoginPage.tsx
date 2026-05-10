import { FormEvent, useState } from 'react';
import { useAuthStore } from '../store';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    clearError();
    try {
      await login(email.trim(), password);
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🏙️</div>
          <div className="auth-logo-text">
            <h1>Civic Saathi</h1>
            <p>Government Issue Management Platform</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <h2>Welcome back</h2>
            <p>Sign in to your admin account</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@civic.gov.in"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', padding: '11px' }}
            disabled={!canSubmit || isLoading}
          >
            {isLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '12px', background: 'var(--bg-3)', borderRadius: 'var(--radius)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
          <strong style={{ color: 'var(--text-2)' }}>Demo credentials:</strong><br />
          Admin: admin@civic.com / password<br />
          Officer: officer@civic.com / password
        </div>
      </div>
    </div>
  );
}
