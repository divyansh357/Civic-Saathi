import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import { apiGet, apiPost } from '../services/api/client';
import { Assignment, Complaint, PagedResponse } from '../types';
import { PriorityBadge, AssignmentStatusBadge } from '../components/StatusBadge';
import { Zap, AlertTriangle, GitMerge, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function isSlaBreached(deadline?: string) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function SlaTimer({ deadline }: { deadline?: string }) {
  if (!deadline) return <span className="text-muted">—</span>;
  const breached = isSlaBreached(deadline);
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.abs(Math.floor(diffMs / 3600000));
  const diffM = Math.abs(Math.floor((diffMs % 3600000) / 60000));
  const label = breached
    ? `${diffH}h ${diffM}m overdue`
    : `${diffH}h ${diffM}m left`;
  return (
    <span style={{ color: breached ? 'var(--red)' : diffH < 2 ? 'var(--yellow)' : 'var(--text-2)', fontSize: '0.8rem' }}>
      {breached ? <XCircle size={16} style={{ color: 'var(--red)' }} className="icon-inline" /> : diffH < 2 ? <AlertCircle size={16} style={{ color: 'var(--yellow)' }} className="icon-inline" /> : <CheckCircle2 size={16} style={{ color: 'var(--green)' }} className="icon-inline" />} {label}
    </span>
  );
}

/* ── Auto-Assign Modal ──────────────────────────────────────────────── */

interface AutoAssignModalProps {
  complaints: Complaint[];
  onClose: () => void;
  onSuccess: () => void;
}

function AutoAssignModal({ complaints, onClose, onSuccess }: AutoAssignModalProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [complaintId, setComplaintId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!complaintId.trim()) { setError('Select a complaint'); return; }
    setSaving(true);
    setError('');
    try {
      await apiPost('/assignments/auto-assign', { complaintId: complaintId.trim() }, accessToken ?? undefined);
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Auto-assign failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Auto-Assign Complaint</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
            The system will automatically route this complaint to the best available department and worker based on category and workload.
          </p>
          <div className="form-group">
            <label className="form-label">Select Complaint</label>
            {complaints.length > 0 ? (
              <select className="form-input" value={complaintId} onChange={(e) => setComplaintId(e.target.value)}>
                <option value="">— Select a complaint —</option>
                {complaints.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.complaintNumber ?? c.id.substring(0, 8)} — {c.title}
                  </option>
                ))}
              </select>
            ) : (
              <input className="form-input" placeholder="Enter complaint UUID" value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)} />
            )}
          </div>
          {error && <div className="auth-error"><AlertTriangle size={16} className="icon-inline" /> {error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Assigning...</> : <><Zap size={16} className="icon-inline" /> Auto-Assign</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Assignments Page ──────────────────────────────────────────── */

export default function AssignmentsPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [overdue, setOverdue] = useState<Assignment[]>([]);
  const [unassignedComplaints, setUnassignedComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'all' | 'overdue'>('all');
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [error, setError] = useState('');
  const PAGE_SIZE = 15;

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      // Fetch all assignments from correct endpoint
      const [assignRes, overdueRes, complaintsRes] = await Promise.all([
        apiGet<{ data?: Assignment[]; totalItems?: number; status?: string }>(`/assignments?page=${page}&size=${PAGE_SIZE}`, accessToken).catch(() => null),
        apiGet<{ data?: Assignment[]; count?: number }>('/assignments/overdue', accessToken).catch(() => null),
        apiGet<PagedResponse<Complaint>>('/complaints?page=0&size=50&sort=createdAt,desc', accessToken).catch(() => null),
      ]);

      // Parse assignments — backend returns { data: [...], totalItems, totalPages }
      if (assignRes?.data) {
        setAssignments(assignRes.data);
        setTotal(assignRes.totalItems ?? assignRes.data.length);
      } else {
        setAssignments([]);
        setTotal(0);
      }

      // Parse overdue
      if (overdueRes?.data) {
        setOverdue(overdueRes.data);
      } else {
        setOverdue([]);
      }

      // Unassigned complaints for auto-assign modal
      if (complaintsRes?.content) {
        setUnassignedComplaints(
          complaintsRes.content.filter((c) => 
            !c.assignedWorkerId && 
            !c.assignedWorkerName &&
            !['CLOSED', 'RESOLVED', 'REJECTED', 'CANCELLED'].includes(c.status)
          )
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleEscalate = async () => {
    if (!accessToken) return;
    setEscalating(true);
    try {
      await apiPost('/assignments/escalate-overdue', {}, accessToken);
      await fetchData();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Escalation failed');
    } finally {
      setEscalating(false);
    }
  };

  const displayed = tab === 'overdue' ? overdue : assignments;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Assignments</h1>
          <p>Track complaint routing, SLA deadlines, and worker assignments</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {overdue.length > 0 && (
            <button className="btn btn-danger" onClick={() => void handleEscalate()} disabled={escalating}>
              {escalating ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <AlertTriangle size={16} className="icon-inline" />}
              Escalate Overdue ({overdue.length})
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowAutoAssign(true)}>
            <Zap size={16} className="icon-inline" /> Auto-Assign
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['all', 'overdue'] as const).map((t) => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setTab(t)}>
            {t === 'all' ? `All Assignments (${total})` : `Overdue (${overdue.length})`}
            {t === 'overdue' && overdue.length > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: '0.65rem', marginLeft: 4 }}>
                {overdue.length}
              </span>
            )}
          </button>
        ))}
        {loading && <span className="spinner" style={{ marginLeft: 8 }} />}
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 16 }}>
          <AlertTriangle size={16} className="icon-inline" /> {error}
        </div>
      )}

      <div className="card">
        {displayed.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon"><GitMerge size={32} /></div>
            <h3>{tab === 'overdue' ? 'No overdue assignments' : 'No assignments found'}</h3>
            <p>{tab === 'overdue' ? 'All assignments are within SLA' : 'Use Auto-Assign to route complaints to workers'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Complaint</th>
                    <th>Department</th>
                    <th>Worker</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>SLA Deadline</th>
                    <th>Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((a) => (
                    <tr key={a.id} style={isSlaBreached(a.slaDeadline) && a.status !== 'COMPLETED' ? { background: 'rgba(248,113,113,0.04)' } : {}}>
                      <td><span className="mono text-accent" style={{ fontSize: '0.75rem' }}>{a.id.substring(0, 8)}</span></td>
                      <td>
                        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.complaintTitle ?? a.complaintId?.substring(0, 8)}
                        </div>
                        {a.escalationReason && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--red)', marginTop: 2 }}>
                            <AlertTriangle size={12} className="icon-inline" /> {a.escalationReason}
                          </div>
                        )}
                      </td>
                      <td className="text-muted">{a.departmentName ?? '—'}</td>
                      <td className="text-muted">{a.assignedWorkerName ?? a.workerName ?? 'Unassigned'}</td>
                      <td><AssignmentStatusBadge status={a.status} /></td>
                      <td>{a.priority ? <PriorityBadge priority={a.priority} /> : '—'}</td>
                      <td><SlaTimer deadline={a.slaDeadline} /></td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>{formatDate(a.assignedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tab === 'all' && totalPages > 1 && (
              <div className="pagination">
                <span>Page {page + 1} of {totalPages}</span>
                <div className="pagination-controls">
                  <button className="page-btn" disabled={page === 0} onClick={() => setPage(0)}>«</button>
                  <button className="page-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹</button>
                  <button className="page-btn active">{page + 1}</button>
                  <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>›</button>
                  <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAutoAssign && (
        <AutoAssignModal
          complaints={unassignedComplaints}
          onClose={() => setShowAutoAssign(false)}
          onSuccess={() => void fetchData()}
        />
      )}
    </div>
  );
}
