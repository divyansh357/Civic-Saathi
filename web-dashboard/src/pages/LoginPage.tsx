import { FormEvent, useState } from 'react';
import { useAuthStore, useThemeStore } from '../store';
import { Building2, Sun, Moon, AlertTriangle, Eye, EyeOff } from 'lucide-react';

// Country codes for the phone field
const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1',  label: '🇺🇸 +1'  },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+971',label: '🇦🇪 +971'},
];

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const { isDark, toggle: toggleTheme } = useThemeStore();

  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // ── Login fields ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // ── Signup fields ─────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [zoneNumber, setZoneNumber] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  // ── Validation ─────────────────────────────────────────────────────────────
  const rawPhone = phone.replace(/\D/g, '');
  const phoneOk = rawPhone.length === 10;
  const emailEndsWithMunicipal = signupEmail.trim().toLowerCase().endsWith('@municipal.in');
  const zoneOk = /^\d+$/.test(zoneNumber.trim());

  const canLogin = email.trim().length > 0 && password.trim().length > 0;
  const canSignup =
    name.trim().length >= 2 &&
    signupEmail.trim().length > 0 &&
    emailEndsWithMunicipal &&
    phoneOk &&
    zoneOk &&
    signupPassword.length >= 8 &&
    signupPassword === confirmPassword;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!canLogin) return;
    clearError();
    try { await login(email.trim(), password); } catch { /* error in store */ }
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
        email: signupEmail.trim(),
        phone: `${countryCode}${rawPhone}`,
        password: signupPassword,
        role,
        zoneNumber: parseInt(zoneNumber, 10),
        departmentCode: departmentCode.trim() || undefined,
      });
      setSignupSuccess('Account created! You can now sign in.');
      setTab('login');
      setSignupPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSignupLoading(false);
    }
  };

  const pwdInputStyle = (show: boolean): React.CSSProperties => ({
    paddingRight: 40,
  });

  return (
    <div className="auth-page">
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          position: 'fixed', top: 16, right: 16,
          background: 'var(--bg-3)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 10px',
          cursor: 'pointer', zIndex: 10, color: 'var(--text-2)',
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
            <div><h2>Welcome back</h2><p>Sign in to your account</p></div>

            {signupSuccess && (
              <div style={{
                background: 'var(--green-bg)', border: '1px solid rgba(52,211,153,0.3)',
                borderRadius: 'var(--radius)', padding: '10px 12px',
                fontSize: '0.82rem', color: 'var(--green)',
              }}>✓ {signupSuccess}</div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email" type="email" className="form-input"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@municipal.in" autoComplete="username" autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showLoginPwd ? 'text' : 'password'}
                  className="form-input"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={pwdInputStyle(showLoginPwd)}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPwd((v) => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0,
                  }}
                  aria-label={showLoginPwd ? 'Hide password' : 'Show password'}
                >
                  {showLoginPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="auth-error"><AlertTriangle size={16} className="icon-inline" /> {error}</div>}

            <button
              type="submit" className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: '11px' }}
              disabled={!canLogin || isLoading}
            >
              {isLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Signup Form ── */}
        {tab === 'signup' && (
          <form className="auth-form" onSubmit={(e) => void handleSignup(e)}>
            <div><h2>Create account</h2><p>Admin / Officer registration</p></div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-name">Full Name</label>
              <input id="su-name" type="text" className="form-input"
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Rajesh Kumar" autoFocus />
            </div>

            {/* Email — must end with @municipal.in */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-email">
                Email address
                <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: 6 }}>
                  (must end with @municipal.in)
                </span>
              </label>
              <input id="su-email" type="email" className="form-input"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="rajesh@municipal.in"
                autoComplete="email"
                style={signupEmail && !emailEndsWithMunicipal ? { borderColor: 'var(--red)' } : {}}
              />
              {signupEmail && !emailEndsWithMunicipal && (
                <span style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 4, display: 'block' }}>
                  Must end with @municipal.in
                </span>
              )}
            </div>

            {/* Phone with country code */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-phone">Phone number (10 digits)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="form-input"
                  style={{ width: 120, flexShrink: 0 }}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <input
                  id="su-phone" type="tel" className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  style={phone && !phoneOk ? { borderColor: 'var(--red)' } : {}}
                />
              </div>
              {phone && !phoneOk && (
                <span style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 4, display: 'block' }}>
                  Enter exactly 10 digits
                </span>
              )}
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-role">Role</label>
              <select id="su-role" className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="ADMIN">Admin</option>
                <option value="OFFICER">Officer</option>
              </select>
            </div>

            {/* Department Code */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-dept">
                Department Code
                <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: 6 }}>(optional)</span>
              </label>
              <input id="su-dept" type="text" className="form-input"
                value={departmentCode}
                onChange={(e) => setDepartmentCode(e.target.value.toUpperCase())}
                placeholder="e.g. ROADS, WATER"
              />
            </div>

            {/* Zone Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-zone">Zone Number</label>
              <input id="su-zone" type="number" min="1" className="form-input"
                value={zoneNumber}
                onChange={(e) => setZoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 4"
                style={zoneNumber && !zoneOk ? { borderColor: 'var(--red)' } : {}}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-pwd">
                Password <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(min 8 chars)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input id="su-pwd"
                  type={showSignupPwd ? 'text' : 'password'}
                  className="form-input"
                  value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  style={pwdInputStyle(showSignupPwd)}
                />
                <button type="button" onClick={() => setShowSignupPwd((v) => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}
                  aria-label={showSignupPwd ? 'Hide' : 'Show'}>
                  {showSignupPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-confirm">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input id="su-confirm"
                  type={showConfirmPwd ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  style={{
                    ...pwdInputStyle(showConfirmPwd),
                    ...(confirmPassword && confirmPassword !== signupPassword ? { borderColor: 'var(--red)' } : {}),
                    ...(confirmPassword && confirmPassword === signupPassword ? { borderColor: 'var(--green)' } : {}),
                  }}
                />
                <button type="button" onClick={() => setShowConfirmPwd((v) => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}
                  aria-label={showConfirmPwd ? 'Hide' : 'Show'}>
                  {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== signupPassword && (
                <span style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 4, display: 'block' }}>
                  Passwords do not match
                </span>
              )}
            </div>

            {signupError && <div className="auth-error"><AlertTriangle size={16} className="icon-inline" /> {signupError}</div>}

            <button type="submit" className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: '11px' }}
              disabled={!canSignup || signupLoading}
            >
              {signupLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
