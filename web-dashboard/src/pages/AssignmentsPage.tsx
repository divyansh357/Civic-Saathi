import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import { apiGet, apiPost } from '../services/api/client';
import { Assignment, PagedResponse } from '../types';
import { PriorityBadge, AssignmentStatusBadge } from '../components/StatusBadge';

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
      {breached ? '🔴' : diffH < 2 ? '🟡' : '🟢'} {label}
    </span>
  );
}

interface AutoAssignModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AutoAssignModal({ onClose, onSuccess }: AutoAssignModalProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [complaintId, setComplaintId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!complaintId.trim()) { setError('Complaint ID is required'); return; }
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
            <label className="form-label">Complaint ID</label>
            <input
              className="form-input"
              placeholder="e.g. C-1001"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
            />
          </div>
          {error && <div className="auth-error">⚠ {error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Assigning...</> : '⚡ Auto-Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [overdue, setOverdue] = useState<Assignment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'all' | 'overdue'>('all');
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const PAGE_SIZE = 15;

  const MOCK_ASSIGNMENTS: Assignment[] = [
    { id: 'A-001', complaintId: 'C-1001', complaintTitle: 'Pothole on MG Road', departmentId: 'd1', departmentName: 'Roads Department', workerId: 'w1', workerName: 'Suresh Kumar', status: 'IN_PROGRESS', priority: 'HIGH', slaDeadline: new Date(Date.now() + 3600000 * 5).toISOString(), assignedAt: '2026-05-10T09:00:00' },
    { id: 'A-002', complaintId: 'C-1002', complaintTitle: 'Water supply disruption', departmentId: 'd2', departmentName: 'Water Works', workerId: 'w2', workerName: 'Ramesh Babu', status: 'ACKNOWLEDGED', priority: 'CRITICAL', slaDeadline: new Date(Date.now() - 3600000 * 2).toISOString(), assignedAt: '2026-05-10T07:30:00' },
    { id: 'A-003', complaintId: 'C-1004', complaintTitle: 'Garbage not collected', departmentId: 'd3', departmentName: 'Sanitation', workerId: 'w3', workerName: 'Mohan Das', status: 'ESCALATED', priority: 'HIGH', slaDeadline: new Date(Date.now() - 3600000 * 8).toISOString(), assignedAt: '2026-05-09T22:30:00', escalationReason: 'SLA breached - no response from worker' },
    { id: 'A-004', complaintId: 'C-1007', complaintTitle: 'Road cave-in near school', departmentId: 'd1', departmentName: 'Roads Department', workerId: 'w4', workerName: 'Anil Verma', status: 'PENDING', priority: 'CRITICAL', slaDeadline: new Date(Date.now() + 3600000 * 1).toISOString(), assignedAt: '2026-05-10T11:00:00' },
    { id: 'A-005', complaintId: 'C-1005', complaintTitle: 'Park bench damaged', departmentId: 'd4', departmentName: 'Parks & Gardens', workerId: 'w5', workerName: 'Kavitha Rao', status: 'COMPLETED', priority: 'LOW', slaDeadline: new Date(Date.now() + 3600000 * 48).toISOString(), assignedAt: '2026-05-09T19:00:00', completedAt: '2026-05-10T10:30:00' },
  ];

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [assignRes, overdueRes] = await Promise.all([
        apiGet<PagedResponse<Assignment>>(`/assignments/department/all?page=${page}&size=${PAGE_SIZE}`, accessToken).catch(() => null),
        apiGet<{ data: Assignment[]; count: number }>('/assignments/overdue', accessToken).catch(() => null),
      ]);
      if (assignRes?.data) { setAssignments(assignRes.data); setTotal(assignRes.totalItems ?? 0); }
      else { setAssignments(MOCK_ASSIGNMENTS); setTotal(MOCK_ASSIGNMENTS.length); }
      if (overdueRes?.data) setOverdue(overdueRes.data);
      else setOverdue(MOCK_ASSIGNMENTS.filter((a) => isSlaBreached(a.slaDeadline) && a.status !== 'COMPLETED'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]); // eslint-disable-line react-hooks/exhaustive-deps

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
            <button
              className="btn btn-danger"
              onClick={() => void handleEscalate()}
              disabled={escalating}
            >
              {escalating ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🚨'}
              Escalate Overdue ({overdue.length})
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowAutoAssign(true)}>
            ⚡ Auto-Assign
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['all', 'overdue'] as const).map((t) => (
          <button
            key={t}
            className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setTab(t)}
          >
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

      <div className="card">
        {displayed.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔀</div>
            <h3>{tab === 'overdue' ? 'No overdue assignments' : 'No assignments found'}</h3>
            <p>{tab === 'overdue' ? 'All assignments are within SLA' : 'Use Auto-Assign to route complaints'}</p>
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
                      <td><span className="mono text-accent">{a.id}</span></td>
                      <td>
                        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.complaintTitle ?? a.complaintId}
                        </div>
                        {a.escalationReason && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--red)', marginTop: 2 }}>
                            ⚠ {a.escalationReason}
                          </div>
                        )}
                      </td>
                      <td className="text-muted">{a.departmentName ?? '—'}</td>
                      <td className="text-muted">{a.workerName ?? 'Unassigned'}</td>
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
          onClose={() => setShowAutoAssign(false)}
          onSuccess={() => void fetchData()}
        />
      )}
    </div>
  );
}
