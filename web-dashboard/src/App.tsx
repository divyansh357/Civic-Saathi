import { useEffect, useState } from 'react';
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

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  complaints: 'Complaints',
  assignments: 'Assignments',
  departments: 'Departments',
  workers: 'Workers',
  users: 'Users',
  analytics: 'Analytics',
  notifications: 'Notifications',
};

export default function App() {
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
        <div style={{ fontSize: 32 }}>🏙️</div>
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
          <span className="topbar-title">{PAGE_TITLES[page] ?? 'Civic Saathi'}</span>
          <div className="topbar-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ fontSize: '1rem', padding: '6px 10px' }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPage('notifications')}
            >
              🔔
            </button>
          </div>
        </div>
        {renderPage()}
      </main>
    </div>
  );
}
