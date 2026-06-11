import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import { apiGet } from '../services/api/client';
import { Department } from '../types';
import { Search } from 'lucide-react';

const MOCK: Department[] = [
  { id: 'd1', name: 'Roads & Infrastructure', code: 'ROADS', categoryType: 'ROADS', city: 'Bengaluru', active: true, headName: 'Rajesh Nair', email: 'roads@civic.gov.in', phone: '080-22334455' },
  { id: 'd2', name: 'Water Works', code: 'WATER', categoryType: 'WATER', city: 'Bengaluru', active: true, headName: 'Anita Sharma', email: 'water@civic.gov.in', phone: '080-22334456' },
  { id: 'd3', name: 'Sanitation & Waste', code: 'SANIT', categoryType: 'SANITATION', city: 'Bengaluru', active: true, headName: 'Mohan Rao', email: 'sanitation@civic.gov.in', phone: '080-22334457' },
  { id: 'd4', name: 'Parks & Gardens', code: 'PARKS', categoryType: 'PARKS', city: 'Bengaluru', active: true, headName: 'Kavitha Reddy', email: 'parks@civic.gov.in', phone: '080-22334458' },
  { id: 'd5', name: 'Electricity & Lighting', code: 'ELEC', categoryType: 'ELECTRICITY', city: 'Bengaluru', active: false, headName: 'Suresh Babu', email: 'electricity@civic.gov.in', phone: '080-22334459' },
];

export default function DepartmentsPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchDepartments = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiGet<{ data: Department[] }>('/departments', accessToken);
      setDepartments(res.data ?? []);
    } catch {
      setDepartments(MOCK);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { void fetchDepartments(); }, [fetchDepartments]);

  const filtered = departments.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Departments</h1>
          <p>{departments.length} government departments configured</p>
        </div>
        <button className="btn btn-primary">+ Add Department</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>🏛️</div>
          <div className="stat-value">{departments.length}</div>
          <div className="stat-label">Total Departments</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>✅</div>
          <div className="stat-value">{departments.filter((d) => d.active).length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>⏸️</div>
          <div className="stat-value">{departments.filter((d) => !d.active).length}</div>
          <div className="stat-label">Inactive</div>
        </div>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-wrap">
            <span className="search-icon"><Search size={16} className="icon-inline" /></span>
            <input
              className="search-input"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading && <span className="spinner" />}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏛️</div>
            <h3>No departments found</h3>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>City</th>
                  <th>Head</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td><span className="mono" style={{ color: 'var(--accent)' }}>{d.code}</span></td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}>
                        {d.categoryType}
                      </span>
                    </td>
                    <td className="text-muted">{d.city}</td>
                    <td className="text-muted">{d.headName ?? '—'}</td>
                    <td className="text-muted" style={{ fontSize: '0.78rem' }}>{d.email}</td>
                    <td>
                      <span className={`badge ${d.active ? 'badge-resolved' : 'badge-closed'}`}>
                        {d.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
