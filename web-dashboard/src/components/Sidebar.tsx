import { useAuthStore } from '../store';

interface NavItem {
  icon: string;
  label: string;
  page: string;
  badge?: number;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: '⬡', label: 'Dashboard', page: 'dashboard' },
  { icon: '📋', label: 'Complaints', page: 'complaints' },
  { icon: '🔀', label: 'Assignments', page: 'assignments' },
  { icon: '🏛️', label: 'Departments', page: 'departments', roles: ['ADMIN', 'SUPERADMIN'] },
  { icon: '👷', label: 'Workers', page: 'workers', roles: ['ADMIN', 'SUPERADMIN', 'OFFICER', 'DEPARTMENT_ADMIN'] },
  { icon: '👥', label: 'Users', page: 'users', roles: ['ADMIN', 'SUPERADMIN'] },
  { icon: '📊', label: 'Analytics', page: 'analytics', roles: ['ADMIN', 'SUPERADMIN', 'OFFICER', 'DEPARTMENT_ADMIN'] },
  { icon: '🔔', label: 'Notifications', page: 'notifications' },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  overdueCount?: number;
}

export default function Sidebar({ currentPage, onNavigate, overdueCount = 0 }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role ?? '');
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏙️</div>
        <div>
          <div className="sidebar-logo-text">Civic Saathi</div>
          <div className="sidebar-logo-sub">Admin Dashboard</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {visibleItems.map((item) => (
          <button
            key={item.page}
            className={`nav-item${currentPage === item.page ? ' active' : ''}`}
            onClick={() => onNavigate(item.page)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
            {item.page === 'assignments' && overdueCount > 0 && (
              <span className="nav-item-badge">{overdueCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => void logout()}>
          <div className="avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name ?? 'User'}</div>
            <div className="sidebar-user-role">{user?.role ?? 'CITIZEN'}</div>
          </div>
          <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>↩</span>
        </div>
      </div>
    </aside>
  );
}
