import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import { apiGet } from '../services/api/client';
import { User } from '../types';

const MOCK: User[] = [
  { id: 'u1', name: 'Rahul Sharma', email: 'rahul@example.com', phone: '9876543210', role: 'CITIZEN', city: 'Bengaluru', verified: true, status: 'ACTIVE', createdAt: '2026-01-15T10:00:00' },
  { id: 'u2', name: 'Priya Patel', email: 'priya@example.com', phone: '9876543211', role: 'CITIZEN', city: 'Bengaluru', verified: true, status: 'ACTIVE', createdAt: '2026-02-10T10:00:00' },
  { id: 'u3', name: 'Rajesh Nair', email: 'rajesh@civic.gov.in', phone: '9876543212', role: 'OFFICER', city: 'Bengaluru', verified: true, status: 'ACTIVE', createdAt: '2025-12-01T10:00:00' },
  { id: 'u4', name: 'Admin User', email: 'admin@civic.com', phone: '9876543213', role: 'ADMIN', city: 'Bengaluru', verified: true, status: 'ACTIVE', createdAt: '2025-11-01T10:00:00' },
  { id: 'u5', name: 'Suresh Kumar', email: 'suresh@civic.gov.in', phone: '9876543214', role: 'WORKER', city: 'Bengaluru', verified: true, status: 'ACTIVE', createdAt: '2026-01-20T10:00:00' },
  { id: 'u6', name: 'Meena Iyer', email: 'meena@example.com', phone: '9876543215', role: 'CITIZEN', city: 'Bengaluru', verified: false, status: 'INACTIVE', createdAt: '2026-03-05T10:00:00' },
];

const ROLE_COLORS: Record<string, string> = {
  CITIZEN: 'badge-submitted',
  WORKER: 'badge-assigned',
  OFFICER: 'badge-verified',
  DEPARTMENT_ADMIN: 'badge-in_progress',
  ADMIN: 'badge-escalated',
  SUPERADMIN: 'badge-escalated',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UsersPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiGet<{ data: User[] }>('/users', accessToken);
      setUsers(res.data ?? []);
    } catch {
      setUsers(MOCK);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Users</h1>
          <p>{users.length} registered users on the platform</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', marginBottom: 20 }}>
        {Object.entries(roleCounts).map(([role, count]) => (
          <div className="stat-card" key={role}>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{count}</div>
            <div className="stat-label">{role}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input"
            style={{ width: 160 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {['CITIZEN', 'WORKER', 'OFFICER', 'DEPARTMENT_ADMIN', 'ADMIN', 'SUPERADMIN'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {loading && <span className="spinner" />}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No users found</h3>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>City</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const initials = u.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted">{u.phone ?? '—'}</td>
                      <td>
                        <span className={`badge ${ROLE_COLORS[u.role] ?? 'badge-submitted'}`}>{u.role}</span>
                      </td>
                      <td className="text-muted">{u.city ?? '—'}</td>
                      <td>
                        <span style={{ color: u.verified ? 'var(--green)' : 'var(--text-3)' }}>
                          {u.verified ? '✓ Verified' : '○ Pending'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.status === 'ACTIVE' ? 'badge-resolved' : 'badge-closed'}`}>
                          {u.status ?? 'ACTIVE'}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>{formatDate(u.createdAt)}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
