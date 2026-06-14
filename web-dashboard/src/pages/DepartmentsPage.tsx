import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import { apiGet, apiPost } from '../services/api/client';
import { Department } from '../types';
import { Search, Building2, CheckCircle2, PauseCircle, Building } from 'lucide-react';

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
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const defaultDept = { name: '', code: '', categoryType: 'GENERAL', headName: '', email: '', phone: '' };
  const [newDept, setNewDept] = useState(defaultDept);

  const fetchDepartments = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiGet<{ content: Department[] }>('/departments', accessToken);
      setDepartments(res.content ?? []);
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
        <button className="btn btn-primary" onClick={() => {
          setEditingDept(null);
          setNewDept(defaultDept);
          setShowModal(true);
        }}>+ Add Department</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}><Building2 size={20} /></div>
          <div className="stat-value">{departments.length}</div>
          <div className="stat-label">Total Departments</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}><CheckCircle2 size={20} /></div>
          <div className="stat-value">{departments.filter((d) => d.active).length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}><PauseCircle size={20} /></div>
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
            <div className="empty-state-icon"><Building size={48} /></div>
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
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        setEditingDept(d);
                        setNewDept({
                          name: d.name || '',
                          code: d.code || '',
                          categoryType: d.categoryType || 'GENERAL',
                          headName: d.headName || '',
                          email: d.email || '',
                          phone: d.phone || ''
                        });
                        setShowModal(true);
                      }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingDept ? 'Edit Department' : 'Add Department'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input className="form-input" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} placeholder="e.g., Roads & Infrastructure" />
              </div>
              <div className="form-group">
                <label className="form-label">Code</label>
                <input className="form-input" value={newDept.code} onChange={e => setNewDept({...newDept, code: e.target.value.toUpperCase()})} placeholder="e.g., ROADS" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" value={newDept.categoryType} onChange={e => setNewDept({...newDept, categoryType: e.target.value})} placeholder="e.g., ROADS" />
              </div>
              <div className="form-group">
                <label className="form-label">Head of Department</label>
                <input className="form-input" value={newDept.headName} onChange={e => setNewDept({...newDept, headName: e.target.value})} placeholder="Name of Head" />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Email</label>
                  <input className="form-input" value={newDept.email} onChange={e => setNewDept({...newDept, email: e.target.value})} placeholder="Email" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={newDept.phone} onChange={e => setNewDept({...newDept, phone: e.target.value})} placeholder="Phone" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={async () => {
                setSaving(true);
                try {
                  const { apiPut } = await import('../services/api/client');
                  if (editingDept) {
                    await apiPut(`/departments/${editingDept.id}`, newDept, accessToken);
                  } else {
                    await apiPost('/departments', newDept, accessToken);
                  }
                  setShowModal(false);
                  fetchDepartments();
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Failed to save department');
                } finally {
                  setSaving(false);
                }
              }}>
                {saving ? 'Saving...' : (editingDept ? 'Save Changes' : 'Add Department')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
