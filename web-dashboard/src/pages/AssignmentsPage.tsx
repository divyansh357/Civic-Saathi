import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import { apiGet, apiPost, apiPut } from '../services/api/client';
import { Assignment, Complaint, PagedResponse, ComplaintStatus } from '../types';
import { PriorityBadge, AssignmentStatusBadge } from '../components/StatusBadge';
import { Zap, AlertTriangle, GitMerge, XCircle, AlertCircle, CheckCircle2, Clock, X, Check } from 'lucide-react';

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

/* ── Task Review Modal ────────────────────────────────────────────── */

interface TaskReviewModalProps {
  assignment: Assignment;
  onClose: () => void;
  onRefresh: () => void;
  onUpdate: (id: string, updates: Partial<Assignment>) => void;
}

function TaskReviewModal({ assignment, onClose, onRefresh, onUpdate }: TaskReviewModalProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [saving, setSaving] = useState(false);
  
  const [editingSla, setEditingSla] = useState(false);
  const [slaHours, setSlaHours] = useState('');
  const [savingSla, setSavingSla] = useState(false);

  const handleSlaUpdate = async () => {
    const hours = parseInt(slaHours, 10);
    if (!slaHours || isNaN(hours) || hours < 1) return;
    setSavingSla(true);
    try {
      // Compute the new deadline: now + hours, formatted as ISO_DATE_TIME
      const newDeadline = new Date(Date.now() + hours * 3600000);
      const iso = newDeadline.toISOString().replace('Z', '').slice(0, 19); // e.g. 2026-06-14T10:30:00
      await apiPut(`/assignments/${assignment.id}/sla?newDeadline=${iso}`, {}, accessToken ?? undefined);
      onUpdate(assignment.id, { slaDeadline: newDeadline.toISOString() });
      setEditingSla(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'SLA update failed');
    } finally {
      setSavingSla(false);
    }
  };

  const handleStatusChange = async (status: ComplaintStatus) => {
    setSaving(true);
    try {
      await apiPut(`/complaints/${assignment.complaintId}/status`, { status }, accessToken ?? undefined);
      
      // Update local assignment status if changing to CLOSED
      if (status === 'CLOSED') {
        onUpdate(assignment.id, { status: 'CLOSED' as any });
      } else if (status === 'IN_PROGRESS') {
        onUpdate(assignment.id, { status: 'IN_PROGRESS' as any });
      }
      
      onRefresh();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const timeTaken = () => {
    if (!assignment.assignedAt || !assignment.completedAt) return null;
    const start = new Date(assignment.assignedAt).getTime();
    const end = new Date(assignment.completedAt).getTime();
    const hrs = Math.floor((end - start) / 3600000);
    const mins = Math.floor(((end - start) % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title">Assignment Review</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <AssignmentStatusBadge status={assignment.status} />
            {assignment.priority && <PriorityBadge priority={assignment.priority} />}
          </div>

          <div className="grid-2">
            <div>
              <div className="form-label">Assignment ID</div>
              <div className="mono text-accent" style={{ marginTop: 4, fontSize: '0.8rem' }}>{assignment.id.substring(0, 8)}</div>
            </div>
            <div>
              <div className="form-label">Worker</div>
              <div style={{ color: 'var(--text)', marginTop: 4 }}>{assignment.assignedWorkerName ?? assignment.workerName ?? 'Unassigned'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="form-label">Complaint Title</div>
              <div style={{ color: 'var(--text)', marginTop: 4, fontWeight: 500 }}>{assignment.complaintTitle ?? assignment.complaintId}</div>
            </div>
          </div>

          <div className="divider" />

          <h4 style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--text)' }}>Time Management & SLA</h4>
          <div className="grid-2" style={{ background: 'var(--bg-2)', padding: 12, borderRadius: 8 }}>
            <div>
              <div className="form-label" style={{ fontSize: '0.75rem' }}>Assigned At</div>
              <div style={{ fontSize: '0.85rem', marginTop: 4 }}>{formatDate(assignment.assignedAt)}</div>
            </div>
            <div>
              <div className="form-label" style={{ fontSize: '0.75rem' }}>Accepted At</div>
              <div style={{ fontSize: '0.85rem', marginTop: 4 }}>{formatDate(assignment.acceptedAt) || '—'}</div>
            </div>
            <div>
              <div className="form-label" style={{ fontSize: '0.75rem' }}>Completed At</div>
              <div style={{ fontSize: '0.85rem', marginTop: 4 }}>{formatDate(assignment.completedAt) || '—'}</div>
            </div>
            <div>
              <div className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                SLA Deadline
                <button className="btn btn-ghost btn-sm" style={{ padding: '0 4px', fontSize: '0.7rem' }} onClick={() => setEditingSla(!editingSla)}>
                  {editingSla ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editingSla ? (
                <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center' }}>
                  <input
                    type="number" min="1" className="form-input"
                    style={{ padding: 4, fontSize: '0.75rem', width: 90 }}
                    value={slaHours}
                    onChange={(e) => setSlaHours(e.target.value.replace(/\D/g, ''))}
                    placeholder="hours"
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>h from now</span>
                  <button className="btn btn-primary btn-sm" style={{ padding: '0 8px', fontSize: '0.75rem' }}
                    onClick={() => void handleSlaUpdate()} disabled={savingSla || !slaHours}>
                    {savingSla ? '...' : 'Save'}
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', marginTop: 4, color: isSlaBreached(assignment.slaDeadline) && assignment.status !== 'COMPLETED' ? 'var(--red)' : 'var(--text)' }}>
                  {formatDate(assignment.slaDeadline) || '—'}
                </div>
              )}
            </div>
            {assignment.completedAt && (
              <div style={{ gridColumn: '1 / -1', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                <div className="form-label" style={{ fontSize: '0.75rem' }}>Time Taken</div>
                <div style={{ fontSize: '0.85rem', marginTop: 4, fontWeight: 600 }}>{timeTaken()}</div>
              </div>
            )}
          </div>

          {assignment.status === 'COMPLETED' && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--text)' }}>Worker Proofs ({assignment.completionImages?.length || 0})</h4>
              {assignment.completionImages && assignment.completionImages.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                  {assignment.completionImages.map((url, i) => {
                    const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') || url.toLowerCase().includes('/video/');
                    return (
                      <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', position: 'relative' }}>
                        {isVideo ? (
                          <div style={{ width: 120, height: 120, background: '#000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontSize: '0.8rem' }}>▶ Play Video</span>
                          </div>
                        ) : (
                          <img src={url} alt={`Proof ${i+1}`} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                        )}
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>No proofs provided.</div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {assignment.status === 'COMPLETED' && (
            <>
              <button className="btn btn-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: 'none' }}
                onClick={() => void handleStatusChange('IN_PROGRESS')} disabled={saving}>
                {saving ? '...' : <><X size={16} className="icon-inline" /> Reject Work</>}
              </button>
              <button className="btn btn-primary" onClick={() => void handleStatusChange('CLOSED')} disabled={saving}>
                {saving ? '...' : <><Check size={16} className="icon-inline" /> Approve & Close</>}
              </button>
            </>
          )}
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
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
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

      // Parse assignments
      const list = assignRes?.data ?? assignRes?.content ?? (Array.isArray(assignRes) ? assignRes : []);
      setAssignments(list);
      setTotal(assignRes?.totalItems ?? assignRes?.totalElements ?? list.length);

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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((a) => (
                    <tr key={a.id} style={isSlaBreached(a.slaDeadline) && a.status !== 'COMPLETED' ? { background: 'rgba(248,113,113,0.04)' } : {}}>
                      <td><span className="mono text-accent" style={{ fontSize: '0.75rem' }}>{a.id.substring(0, 8)}</span></td>
                      <td>
                        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.complaintNumber ?? a.complaintId?.substring(0, 8)} — {a.complaintTitle}
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
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAssignment(a)}>Review</button>
                      </td>
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

      {selectedAssignment && (
        <TaskReviewModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onRefresh={() => void fetchData()}
          onUpdate={(id, updates) => {
            setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
            if (selectedAssignment.id === id) {
              setSelectedAssignment({ ...selectedAssignment, ...updates });
            }
          }}
        />
      )}
    </div>
  );
}
