import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import { apiGet, apiPut } from '../services/api/client';
import { User } from '../types';
import { Search, Users, X } from 'lucide-react';

// Extended type for the full profile response
interface UserProfile extends User {
  address?: string;
  aadharNumber?: string;
  zoneNumber?: number;
  departmentCode?: string;
  profileComplete?: boolean;
}

const MOCK: UserProfile[] = [
  { id: 'u1', name: 'Rahul Sharma',  email: 'rahul@example.com',      phone: '9876543210', role: 'CITIZEN', city: 'Bengaluru', verified: true,  status: 'ACTIVE',   createdAt: '2026-01-15T10:00:00', zoneNumber: 3 },
  { id: 'u2', name: 'Priya Patel',   email: 'priya@example.com',       phone: '9876543211', role: 'CITIZEN', city: 'Bengaluru', verified: true,  status: 'ACTIVE',   createdAt: '2026-02-10T10:00:00', zoneNumber: 2 },
  { id: 'u3', name: 'Rajesh Nair',   email: 'rajesh@municipal.in',     phone: '9876543212', role: 'OFFICER', city: 'Bengaluru', verified: true,  status: 'ACTIVE',   createdAt: '2025-12-01T10:00:00', departmentCode: 'ROADS', zoneNumber: 1 },
  { id: 'u4', name: 'Admin User',    email: 'admin@municipal.in',      phone: '9876543213', role: 'ADMIN',   city: 'Bengaluru', verified: true,  status: 'ACTIVE',   createdAt: '2025-11-01T10:00:00', departmentCode: 'ADMIN', zoneNumber: 1 },
  { id: 'u5', name: 'Suresh Kumar',  email: 'suresh@municipal.in',     phone: '9876543214', role: 'WORKER',  city: 'Bengaluru', verified: true,  status: 'ACTIVE',   createdAt: '2026-01-20T10:00:00', departmentCode: 'WATER', zoneNumber: 3 },
  { id: 'u6', name: 'Meena Iyer',    email: 'meena@example.com',       phone: '9876543215', role: 'CITIZEN', city: 'Bengaluru', verified: false, status: 'INACTIVE', createdAt: '2026-03-05T10:00:00', zoneNumber: 4 },
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

// ── Profile modal ─────────────────────────────────────────────────────────────

interface ProfileModalProps {
  user: UserProfile;
  accessToken: string | null;
  onClose: () => void;
  onSaved: (updated: UserProfile) => void;
}

function ProfileModal({ user, accessToken, onClose, onSaved }: ProfileModalProps) {
  const [name, setName] = useState(user.name ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [address, setAddress] = useState(user.address ?? '');
  const [aadharNumber, setAadharNumber] = useState(user.aadharNumber ?? '');
  const [zoneNumber, setZoneNumber] = useState(user.zoneNumber != null ? String(user.zoneNumber) : '');
  const [departmentCode, setDepartmentCode] = useState(user.departmentCode ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const aadharLocked = !!(user.aadharNumber && user.aadharNumber.length === 12);
  const aadharOk = aadharLocked || /^\d{12}$/.test(aadharNumber);

  const handleSave = async () => {
    if (!accessToken) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload: Record<string, unknown> = {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        zoneNumber: zoneNumber ? parseInt(zoneNumber, 10) : undefined,
        departmentCode: departmentCode.trim() || undefined,
      };
      if (!aadharLocked && aadharNumber) payload.aadharNumber = aadharNumber;

      const updated = await apiPut<UserProfile>(`/users/${user.id}`, payload, accessToken);
      onSaved({ ...user, ...updated });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'var(--bg)', borderRadius: 16, padding: 28,
        width: '100%', maxWidth: 520, maxHeight: '90vh',
        overflowY: 'auto', position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
        }}>
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div className="avatar" style={{ width: 48, height: 48, fontSize: '1.1rem' }}>
            {user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{user.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{user.email}</div>
            <span className={`badge ${ROLE_COLORS[user.role] ?? 'badge-submitted'}`} style={{ marginTop: 4 }}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Read-only info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 20, fontSize: '0.82rem', color: 'var(--text-3)' }}>
          <div><strong>Verified:</strong> {user.verified ? '✓ Yes' : '✗ No'}</div>
          <div><strong>Status:</strong> {user.status ?? '—'}</div>
          <div><strong>City:</strong> {user.city ?? '—'}</div>
          <div><strong>Joined:</strong> {formatDate(user.createdAt)}</div>
          <div><strong>Zone:</strong> {user.zoneNumber ?? '—'}</div>
          <div><strong>Profile complete:</strong> {user.profileComplete ? 'Yes' : 'No'}</div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

        {/* Editable fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem' }}>Edit Profile</h4>

          {[
            { label: 'Full Name', value: name, set: setName, placeholder: 'Full name' },
            { label: 'Phone', value: phone, set: setPhone, placeholder: '10-digit number' },
            { label: 'Address', value: address, set: setAddress, placeholder: 'House No., Street, City' },
            { label: 'Zone Number', value: zoneNumber, set: setZoneNumber, placeholder: 'e.g. 4', type: 'number' },
            { label: 'Department Code', value: departmentCode, set: setDepartmentCode, placeholder: 'e.g. ROADS' },
          ].map(({ label, value, set, placeholder, type }) => (
            <div className="form-group" key={label} style={{ margin: 0 }}>
              <label className="form-label">{label}</label>
              <input
                type={type ?? 'text'}
                className="form-input"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}

          {/* Aadhar — locked once set */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              Aadhar Number
              {aadharLocked && (
                <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: 6 }}>
                  (locked — cannot be changed)
                </span>
              )}
            </label>
            <input
              type="text"
              className="form-input"
              value={aadharLocked ? '••••••••' + (user.aadharNumber ?? '').slice(-4) : aadharNumber}
              onChange={(e) => { if (!aadharLocked) setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12)); }}
              placeholder="12-digit Aadhar"
              disabled={aadharLocked}
              maxLength={12}
              style={aadharLocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
            {!aadharLocked && aadharNumber && !aadharOk && (
              <span style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 4, display: 'block' }}>
                Must be exactly 12 digits
              </span>
            )}
          </div>
        </div>

        {saveError && (
          <div className="auth-error" style={{ marginTop: 14 }}>
            <X size={14} className="icon-inline" /> {saveError}
          </div>
        )}

        <button
          className="btn btn-primary w-full"
          style={{ marginTop: 20, justifyContent: 'center', padding: '11px' }}
          onClick={() => void handleSave()}
          disabled={saving || (!aadharLocked && !!aadharNumber && !aadharOk)}
        >
          {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiGet<{ content: UserProfile[] }>('/users', accessToken);
      setUsers(res.content ?? []);
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

  const handleSaved = (updated: UserProfile) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setSelectedUser(updated);
  };

  return (
    <div className="page-content">
      {selectedUser && (
        <ProfileModal
          user={selectedUser}
          accessToken={accessToken}
          onClose={() => setSelectedUser(null)}
          onSaved={handleSaved}
        />
      )}

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
            <span className="search-icon"><Search size={16} className="icon-inline" /></span>
            <input
              className="search-input" placeholder="Search users..."
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-input" style={{ width: 160 }}
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {['CITIZEN', 'WORKER', 'OFFICER', 'DEPARTMENT_ADMIN', 'ADMIN', 'SUPERADMIN'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {loading && <span className="spinner" />}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={16} className="icon-inline" /></div>
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
                  <th>Zone</th>
                  <th>Dept Code</th>
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
                      <td><span className={`badge ${ROLE_COLORS[u.role] ?? 'badge-submitted'}`}>{u.role}</span></td>
                      <td className="text-muted">{u.zoneNumber ?? '—'}</td>
                      <td className="text-muted">{u.departmentCode ?? '—'}</td>
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
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setSelectedUser(u)}
                        >
                          View
                        </button>
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
