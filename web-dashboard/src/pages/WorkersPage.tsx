import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import { apiGet } from '../services/api/client';
import { Worker } from '../types';

const MOCK: Worker[] = [
  { id: 'w1', name: 'Suresh Kumar', email: 'suresh@civic.gov.in', designation: 'Field Engineer', departmentName: 'Roads Department', available: true, activeComplaintsCount: 3 },
  { id: 'w2', name: 'Ramesh Babu', email: 'ramesh@civic.gov.in', designation: 'Plumber', departmentName: 'Water Works', available: true, activeComplaintsCount: 5 },
  { id: 'w3', name: 'Mohan Das', email: 'mohan@civic.gov.in', designation: 'Sanitation Worker', departmentName: 'Sanitation', available: false, activeComplaintsCount: 0 },
  { id: 'w4', name: 'Anil Verma', email: 'anil@civic.gov.in', designation: 'Civil Engineer', departmentName: 'Roads Department', available: true, activeComplaintsCount: 2 },
  { id: 'w5', name: 'Kavitha Rao', email: 'kavitha@civic.gov.in', designation: 'Horticulturist', departmentName: 'Parks & Gardens', available: true, activeComplaintsCount: 1 },
  { id: 'w6', name: 'Deepak Joshi', email: 'deepak@civic.gov.in', designation: 'Electrician', departmentName: 'Electricity', available: false, activeComplaintsCount: 4 },
];

export default function WorkersPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const fetchWorkers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiGet<{ data: Worker[] }>('/workers', accessToken);
      setWorkers(res.data ?? []);
    } catch {
      setWorkers(MOCK);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { void fetchWorkers(); }, [fetchWorkers]);

  const departments = [...new Set(workers.map((w) => w.departmentName).filter(Boolean))];

  const filtered = workers.filter((w) => {
    const matchSearch = !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.email?.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || w.departmentName === deptFilter;
    return matchSearch && matchDept;
  });

  const available = workers.filter((w) => w.available).length;
  const avgLoad = workers.length > 0
    ? (workers.reduce((sum, w) => sum + (w.activeComplaintsCount ?? 0), 0) / workers.length).toFixed(1)
    : '0';

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Workers</h1>
          <p>Field workers and their current workload</p>
        </div>
        <button className="btn btn-primary">+ Add Worker</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>👷</div>
          <div className="stat-value">{workers.length}</div>
          <div className="stat-label">Total Workers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>🟢</div>
          <div className="stat-value">{available}</div>
          <div className="stat-label">Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>🔴</div>
          <div className="stat-value">{workers.length - available}</div>
          <div className="stat-label">Unavailable</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)' }}>📊</div>
          <div className="stat-value">{avgLoad}</div>
          <div className="stat-label">Avg Workload</div>
        </div>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search workers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input"
            style={{ width: 200 }}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {loading && <span className="spinner" />}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👷</div>
            <h3>No workers found</h3>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Availability</th>
                  <th>Active Tasks</th>
                  <th>Workload</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => {
                  const load = w.activeComplaintsCount ?? 0;
                  const loadPct = Math.min(100, (load / 10) * 100);
                  const loadColor = load >= 8 ? 'var(--red)' : load >= 5 ? 'var(--yellow)' : 'var(--green)';
                  return (
                    <tr key={w.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                            {w.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{w.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{w.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted">{w.designation ?? '—'}</td>
                      <td className="text-muted">{w.departmentName ?? '—'}</td>
                      <td>
                        <span className={`badge ${w.available ? 'badge-resolved' : 'badge-closed'}`}>
                          {w.available ? '🟢 Available' : '🔴 Busy'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: loadColor }}>{load}</span>
                        <span className="text-muted"> tasks</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden', minWidth: 80 }}>
                            <div style={{ width: `${loadPct}%`, height: '100%', background: loadColor, borderRadius: 3, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', minWidth: 28 }}>{load}/10</span>
                        </div>
                      </td>
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
