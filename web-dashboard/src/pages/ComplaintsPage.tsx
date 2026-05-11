import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import { apiGet, apiPut, apiPost } from '../services/api/client';
import { Complaint, ComplaintStatus, PagedResponse, ReopenRequest } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

const STATUS_OPTIONS: ComplaintStatus[] = [
  'SUBMITTED', 'VERIFIED', 'ROUTED', 'ASSIGNED', 'IN_PROGRESS',
  'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED', 'ESCALATED'
];

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface DetailModalProps {
  complaint: Complaint;
  onClose: () => void;
  onStatusUpdate: (id: string, status: ComplaintStatus) => void;
}

function DetailModal({ complaint, onClose, onStatusUpdate }: DetailModalProps) {
  const [newStatus, setNewStatus] = useState<ComplaintStatus>(complaint.status);
  const [saving, setSaving] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [reopenRequests, setReopenRequests] = useState<ReopenRequest[]>([]);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;
    apiGet<ReopenRequest[]>(`/reopen-requests/complaint/${complaint.id}`, accessToken)
      .catch(() => [])
      .then((data) => setReopenRequests(Array.isArray(data) ? data : []));
  }, [complaint.id, accessToken]);

  const handleUpdate = async () => {
    if (newStatus === complaint.status) { onClose(); return; }
    setSaving(true);
    try {
      await apiPut(`/complaints/${complaint.id}/status`, { status: newStatus }, accessToken ?? undefined);
      onStatusUpdate(complaint.id, newStatus);
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEscalate = async () => {
    setEscalating(true);
    try {
      await apiPost(`/complaints/${complaint.id}/escalate`, { reason: 'Manual escalation by officer' }, accessToken ?? undefined);
      onStatusUpdate(complaint.id, 'ESCALATED');
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Escalation failed');
    } finally {
      setEscalating(false);
    }
  };

  const handleReopenAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await apiPost(`/reopen-requests/${requestId}/${action}`, {}, accessToken ?? undefined);
      setReopenRequests((prev) => prev.map((r) =>
        r.id === requestId ? { ...r, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : r
      ));
      if (action === 'approve') onStatusUpdate(complaint.id, 'REOPENED');
    } catch (e) {
      alert(e instanceof Error ? e.message : `Failed to ${action} reopen request`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Complaint Details</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={complaint.status} />
            {complaint.priority && <PriorityBadge priority={complaint.priority} />}
            {complaint.category && (
              <span className="badge" style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}>
                {complaint.category}
              </span>
            )}
          </div>

          <div>
            <div className="form-label" style={{ marginBottom: 4 }}>Title</div>
            <div style={{ color: 'var(--text)', fontWeight: 600 }}>{complaint.title}</div>
          </div>

          {complaint.description && (
            <div>
              <div className="form-label" style={{ marginBottom: 4 }}>Description</div>
              <div style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.6 }}>{complaint.description}</div>
            </div>
          )}

          <div className="grid-2">
            <div>
              <div className="form-label">Complaint ID</div>
              <div className="mono text-accent" style={{ marginTop: 4 }}>{complaint.id}</div>
            </div>
            <div>
              <div className="form-label">Submitted By</div>
              <div style={{ color: 'var(--text)', marginTop: 4 }}>{complaint.userName ?? '—'}</div>
            </div>
            <div>
              <div className="form-label">Department</div>
              <div style={{ color: 'var(--text)', marginTop: 4 }}>{complaint.departmentName ?? 'Unassigned'}</div>
            </div>
            <div>
              <div className="form-label">Worker</div>
              <div style={{ color: 'var(--text)', marginTop: 4 }}>{complaint.assignedWorkerName ?? 'Unassigned'}</div>
            </div>
            {complaint.address && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="form-label">Location</div>
                <div style={{ color: 'var(--text-2)', marginTop: 4 }}>📍 {complaint.address}</div>
              </div>
            )}
            <div>
              <div className="form-label">Created</div>
              <div style={{ color: 'var(--text-2)', marginTop: 4 }}>{formatDate(complaint.createdAt)}</div>
            </div>
            <div>
              <div className="form-label">Updated</div>
              <div style={{ color: 'var(--text-2)', marginTop: 4 }}>{formatDate(complaint.updatedAt)}</div>
            </div>
          </div>

          <div className="divider" />

          <div className="form-group">
            <label className="form-label">Update Status</label>
            <select
              className="form-input"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Reopen Requests */}
          {reopenRequests.length > 0 && (
            <div>
              <div className="form-label" style={{ marginBottom: 8 }}>Reopen Requests ({reopenRequests.length})</div>
              {reopenRequests.map((r) => (
                <div key={r.id} style={{
                  background: 'var(--bg-2)', borderRadius: 8, padding: '10px 12px',
                  marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
                }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{r.reason ?? 'No reason provided'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
                      Reopen #{r.reopenCount} · {r.status}
                    </div>
                  </div>
                  {r.status === 'REQUESTED' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: 'var(--green-bg)', color: 'var(--green)', border: 'none' }}
                        onClick={() => void handleReopenAction(r.id, 'approve')}>✓ Approve</button>
                      <button className="btn btn-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: 'none' }}
                        onClick={() => void handleReopenAction(r.id, 'reject')}>✕ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {!['RESOLVED', 'CLOSED', 'ESCALATED'].includes(complaint.status) && (
            <button className="btn btn-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: 'none' }}
              onClick={() => void handleEscalate()} disabled={escalating}>
              {escalating ? '...' : '🚨 Escalate'}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => void handleUpdate()} disabled={saving}>
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComplaintsPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const PAGE_SIZE = 15;

  const fetchComplaints = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        sortBy: 'createdAt',
        sortDir: 'DESC',
      });
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await apiGet<PagedResponse<Complaint>>(
        `/complaints?${params.toString()}`,
        accessToken
      );
      setComplaints(res.data ?? []);
      setTotal(res.totalItems ?? 0);
    } catch {
      // Use mock data if API not ready
      setComplaints([
        { id: 'C-1001', title: 'Pothole on MG Road near bus stop', status: 'ASSIGNED', priority: 'HIGH', category: 'Roads', userName: 'Rahul Sharma', departmentName: 'Roads Dept', createdAt: '2026-05-10T08:30:00', updatedAt: '2026-05-10T10:00:00', address: 'MG Road, Bengaluru' },
        { id: 'C-1002', title: 'Water supply disruption in sector 4', status: 'IN_PROGRESS', priority: 'CRITICAL', category: 'Water', userName: 'Priya Patel', departmentName: 'Water Works', createdAt: '2026-05-10T07:15:00', updatedAt: '2026-05-10T09:30:00' },
        { id: 'C-1003', title: 'Broken street light on Park Avenue', status: 'SUBMITTED', priority: 'MEDIUM', category: 'Electricity', userName: 'Amit Kumar', createdAt: '2026-05-10T06:45:00', updatedAt: '2026-05-10T06:45:00' },
        { id: 'C-1004', title: 'Garbage not collected for 3 days', status: 'ESCALATED', priority: 'HIGH', category: 'Sanitation', userName: 'Sunita Devi', departmentName: 'Sanitation', createdAt: '2026-05-09T22:00:00', updatedAt: '2026-05-10T08:00:00' },
        { id: 'C-1005', title: 'Park bench damaged near children area', status: 'RESOLVED', priority: 'LOW', category: 'Parks', userName: 'Vikram Singh', departmentName: 'Parks & Gardens', createdAt: '2026-05-09T18:30:00', updatedAt: '2026-05-10T11:00:00' },
        { id: 'C-1006', title: 'Sewage overflow on main street', status: 'VERIFIED', priority: 'CRITICAL', category: 'Sanitation', userName: 'Meena Iyer', createdAt: '2026-05-09T15:00:00', updatedAt: '2026-05-09T16:00:00' },
        { id: 'C-1007', title: 'Road cave-in near school', status: 'ASSIGNED', priority: 'CRITICAL', category: 'Roads', userName: 'Ravi Nair', departmentName: 'Roads Dept', createdAt: '2026-05-09T12:00:00', updatedAt: '2026-05-09T14:00:00' },
      ]);
      setTotal(7);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, statusFilter, search]);

  useEffect(() => { void fetchComplaints(); }, [fetchComplaints]);

  const handleStatusUpdate = (id: string, status: ComplaintStatus) => {
    setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Complaints</h1>
          <p>{total.toLocaleString()} total complaints in the system</p>
        </div>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>

          <select
            className="form-input"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <button className="btn btn-ghost btn-sm" onClick={() => void fetchComplaints()}>
            🔄 Refresh
          </button>

          {loading && <span className="spinner" />}
        </div>

        {complaints.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No complaints found</h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Department</th>
                    <th>Citizen</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td><span className="mono text-accent">{c.id}</span></td>
                      <td>
                        <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.title}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}>
                          {c.category ?? '—'}
                        </span>
                      </td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{c.priority ? <PriorityBadge priority={c.priority} /> : '—'}</td>
                      <td className="text-muted">{c.departmentName ?? 'Unassigned'}</td>
                      <td className="text-muted">{c.userName ?? '—'}</td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>{formatDate(c.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setSelected(c)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>Showing {Math.min(page * PAGE_SIZE + 1, total)}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 0} onClick={() => setPage(0)}>«</button>
                <button className="page-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                  return (
                    <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>
                      {p + 1}
                    </button>
                  );
                })}
                <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>›</button>
                <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
              </div>
            </div>
          </>
        )}
      </div>

      {selected && (
        <DetailModal
          complaint={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
