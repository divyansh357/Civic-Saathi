import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useThemeStore } from './store';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ComplaintsPage from './pages/ComplaintsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import WorkersPage from './pages/WorkersPage';
import UsersPage from './pages/UsersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import { Building2, Sun, Moon, Bell, Globe } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'topbar.dashboard',
  complaints: 'topbar.complaints',
  assignments: 'topbar.assignments',
  departments: 'topbar.departments',
  workers: 'topbar.workers',
  users: 'topbar.users',
  analytics: 'topbar.analytics',
  notifications: 'topbar.notifications',
};

export default function App() {
  const { t, i18n } = useTranslation();
  const hydrate = useAuthStore((s) => s.hydrate);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const [page, setPage] = useState('dashboard');
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    hydrate().finally(() => setBootstrapped(true));
  }, [hydrate]);

  if (!bootstrapped || isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{ fontSize: 32 }}><Building2 size={32} /></div>
        <div className="spinner" style={{ width: 28, height: 28 }} />
        <div style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Loading Civic Saathi...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'complaints': return <ComplaintsPage />;
      case 'assignments': return <AssignmentsPage />;
      case 'departments': return <DepartmentsPage />;
      case 'workers': return <WorkersPage />;
      case 'users': return <UsersPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'notifications': return <NotificationsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="layout">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="main">
        <div className="topbar">
          <span className="topbar-title">{PAGE_TITLES[page] ? t(PAGE_TITLES[page]) : 'Civic Saathi'}</span>
          <div className="topbar-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => i18n.changeLanguage(i18n.language === 'hi' ? 'en' : 'hi')}
              title={i18n.language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
              style={{ fontSize: '0.85rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
            >
              <Globe size={18} />
              {i18n.language === 'hi' ? 'EN' : 'HI'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={toggleTheme}
              title={isDark ? t('topbar.switch_light') : t('topbar.switch_dark')}
              style={{ fontSize: '1rem', padding: '6px 10px' }}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPage('notifications')}
            >
              <Bell size={20} />
            </button>
          </div>
        </div>
        {renderPage()}
      </main>
    </div>
  );
}
