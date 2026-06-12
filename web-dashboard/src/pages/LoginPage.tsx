import { FormEvent, useState } from 'react';
import { useAuthStore, useThemeStore } from '../store';
import { Building2, Sun, Moon, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const { isDark, toggle: toggleTheme } = useThemeStore();

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  const canLogin = email.trim().length > 0 && password.trim().length > 0;
  const canSignup =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    phone.trim().length >= 10 &&
    password.length >= 8 &&
    password === confirmPassword;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!canLogin) return;
    clearError();
    try {
      await login(email.trim(), password);
    } catch {
      // error is set in store
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSignup) return;
    setSignupLoading(true);
    setSignupError('');
    setSignupSuccess('');
    try {
      const { apiPost } = await import('../services/api/client');
      await apiPost('/auth/signup', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: 'citizen',
      });
      setSignupSuccess('Account created! You can now sign in.');
      setTab('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Theme toggle — top right corner */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          position: 'fixed', top: 16, right: 16,
          background: 'var(--bg-3)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 10px', fontSize: '1rem',
          cursor: 'pointer', zIndex: 10,
          color: 'var(--text-2)',
        }}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Building2 size={32} /></div>
          <div className="auth-logo-text">
            <h1>Civic Saathi</h1>
            <p>Government Issue Management Platform</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'var(--bg-3)', borderRadius: 10, padding: 4,
        }}>
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); clearError(); setSignupError(''); setSignupSuccess(''); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                background: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-3)',
                fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* ── Login Form ── */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={(e) => void handleLogin(e)}>
            <div>
              <h2>Welcome back</h2>
              <p>Sign in to your account</p>
            </div>

            {signupSuccess && (
              <div style={{
                background: 'var(--green-bg)', border: '1px solid rgba(52,211,153,0.3)',
                borderRadius: 'var(--radius)', padding: '10px 12px',
                fontSize: '0.82rem', color: 'var(--green)',
              }}>
                ✓ {signupSuccess}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
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
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {error && <div className="auth-error"><AlertTriangle size={16} className="icon-inline" /> {error}</div>}

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: '11px' }}
              disabled={!canLogin || isLoading}
            >
              {isLoading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</>
                : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Signup Form ── */}
        {tab === 'signup' && (
          <form className="auth-form" onSubmit={(e) => void handleSignup(e)}>
            <div>
              <h2>Create account</h2>
              <p>Register to report civic issues</p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-phone">Phone number</label>
              <input
                id="signup-phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">
                Password <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(min 8 chars)</span>
              </label>
              <input
                id="signup-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
              <input
                id="signup-confirm"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                style={confirmPassword && confirmPassword !== password
                  ? { borderColor: 'var(--red)' }
                  : confirmPassword && confirmPassword === password
                    ? { borderColor: 'var(--green)' }
                    : {}}
              />
              {confirmPassword && confirmPassword !== password && (
                <span style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 4 }}>
                  Passwords do not match
                </span>
              )}
            </div>

            {signupError && <div className="auth-error"><AlertTriangle size={16} className="icon-inline" /> {signupError}</div>}

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: '11px' }}
              disabled={!canSignup || signupLoading}
            >
              {signupLoading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</>
                : 'Create Account'}
            </button>
          </form>
        )}

        {/* Demo hint — only on login tab */}
        {tab === 'login' && (
          <div style={{
            marginTop: 20, padding: '10px 12px',
            background: 'var(--bg-3)', borderRadius: 'var(--radius)',
            fontSize: '0.78rem', color: 'var(--text-3)',
          }}>
            <strong style={{ color: 'var(--text-2)' }}>Demo credentials:</strong><br />
            Admin: admin@civic.com / password<br />
            Officer: officer@civic.com / password
          </div>
        )}
      </div>
    </div>
  );
}
