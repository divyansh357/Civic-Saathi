import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useThemeStore } from '../store';
import { Building2, Sun, Moon, AlertTriangle, Eye, EyeOff, Globe } from 'lucide-react';

// Country codes for the phone field
const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1',  label: '🇺🇸 +1'  },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+971',label: '🇦🇪 +971'},
];

export default function LoginPage() {
  const { t, i18n } = useTranslation();
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
      setSignupSuccess(t('login.success_msg'));
      setTab('login');
      setSignupPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : t('login.fail_msg'));
    } finally {
      setSignupLoading(false);
    }
  };

  const pwdInputStyle = (show: boolean): React.CSSProperties => ({
    paddingRight: 40,
  });

  return (
    <div className="auth-page">
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10 }}>
        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'hi' ? 'en' : 'hi')}
          title={i18n.language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px',
            cursor: 'pointer', color: 'var(--text-2)',
            fontWeight: 500, fontSize: '0.85rem'
          }}
        >
          <Globe size={18} />
          {i18n.language === 'hi' ? 'EN' : 'HI'}
        </button>
        <button
          onClick={toggleTheme}
          title={isDark ? t('login.switch_light') : t('login.switch_dark')}
          style={{
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 10px',
            cursor: 'pointer', color: 'var(--text-2)',
          }}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Building2 size={32} /></div>
          <div className="auth-logo-text">
            <h1>Civic Saathi</h1>
            <p>{t('login.subtitle')}</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'var(--bg-3)', borderRadius: 10, padding: 4,
        }}>
          {(['login', 'signup'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => { setTab(tabKey); clearError(); setSignupError(''); setSignupSuccess(''); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                background: tab === tabKey ? 'var(--accent)' : 'transparent',
                color: tab === tabKey ? '#fff' : 'var(--text-3)',
                fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tabKey === 'login' ? t('login.tab_signin') : t('login.tab_signup')}
            </button>
          ))}
        </div>

        {/* ── Login Form ── */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={(e) => void handleLogin(e)}>
            <div><h2>{t('login.welcome_back')}</h2><p>{t('login.signin_prompt')}</p></div>

            {signupSuccess && (
              <div style={{
                background: 'var(--green-bg)', border: '1px solid rgba(52,211,153,0.3)',
                borderRadius: 'var(--radius)', padding: '10px 12px',
                fontSize: '0.82rem', color: 'var(--green)',
              }}>✓ {signupSuccess}</div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">{t('login.email_label')}</label>
              <input
                id="login-email" type="email" className="form-input"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@municipal.in" autoComplete="username" autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">{t('login.pwd_label')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showLoginPwd ? 'text' : 'password'}
                  className="form-input"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.pwd_placeholder')}
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
              {isLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> {t('login.signing_in')}</> : t('login.tab_signin')}
            </button>
          </form>
        )}

        {/* ── Signup Form ── */}
        {tab === 'signup' && (
          <form className="auth-form" onSubmit={(e) => void handleSignup(e)}>
            <div><h2>{t('login.signup_title')}</h2><p>{t('login.signup_subtitle')}</p></div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-name">{t('login.name_label')}</label>
              <input id="su-name" type="text" className="form-input"
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Rajesh Kumar" autoFocus />
            </div>

            {/* Email — must end with @municipal.in */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-email">
                {t('login.email_label')}
                <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: 6 }}>
                  {t('login.email_hint')}
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
                  {t('login.email_error')}
                </span>
              )}
            </div>

            {/* Phone with country code */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-phone">{t('login.phone_label')}</label>
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
                  {t('login.phone_error')}
                </span>
              )}
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-role">{t('login.role_label')}</label>
              <select id="su-role" className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="ADMIN">{t('login.role_admin')}</option>
                <option value="OFFICER">{t('login.role_officer')}</option>
              </select>
            </div>

            {/* Department Code */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-dept">
                {t('login.dept_label')}
                <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: 6 }}>{t('login.optional')}</span>
              </label>
              <input id="su-dept" type="text" className="form-input"
                value={departmentCode}
                onChange={(e) => setDepartmentCode(e.target.value.toUpperCase())}
                placeholder="e.g. ROADS, WATER"
              />
            </div>

            {/* Zone Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="su-zone">{t('login.zone_label')}</label>
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
                {t('login.pwd_label')} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>{t('login.pwd_hint')}</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input id="su-pwd"
                  type={showSignupPwd ? 'text' : 'password'}
                  className="form-input"
                  value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder={t('login.pwd_create_placeholder')}
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
              <label className="form-label" htmlFor="su-confirm">{t('login.confirm_label')}</label>
              <div style={{ position: 'relative' }}>
                <input id="su-confirm"
                  type={showConfirmPwd ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('login.confirm_placeholder')}
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
                  {t('login.confirm_error')}
                </span>
              )}
            </div>

            {signupError && <div className="auth-error"><AlertTriangle size={16} className="icon-inline" /> {signupError}</div>}

            <button type="submit" className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: '11px' }}
              disabled={!canSignup || signupLoading}
            >
              {signupLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> {t('login.creating')}</> : t('login.tab_signup')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
