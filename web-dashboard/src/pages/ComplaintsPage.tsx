import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store';
import { apiGet, apiPut, apiPost } from '../services/api/client';
import { Complaint, ComplaintStatus, PagedResponse, ReopenRequest, Worker } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { AlertTriangle, Search, ClipboardList, MapPin, RefreshCw, X, Check, UserPlus } from 'lucide-react';

const STATUS_OPTIONS: ComplaintStatus[] = [
  'OPEN', 'SUBMITTED', 'DUPLICATE_CHECKED', 'VERIFIED', 'ROUTED', 
  'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 
  'VERIFIED_FOR_CLOSURE', 'CLOSED', 'REOPENED', 'REJECTED', 
  'CANCELLED', 'ESCALATED'
];

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Assign Worker Modal ────────────────────────────────────────────── */

interface AssignWorkerModalProps {
  complaint: Complaint;
  onClose: () => void;
  onAssigned: () => void;
}

function AssignWorkerModal({ complaint, onClose, onAssigned }: AssignWorkerModalProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deadlineHours, setDeadlineHours] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);

    // If the complaint has a department assigned, fetch only workers from that department.
    // This ensures complaint type ↔ department ↔ worker alignment.
    const endpoint = complaint.departmentId
      ? `/workers/department/${complaint.departmentId}?page=0&size=100`
      : `/workers?page=0&size=100`;

    apiGet<{ content?: Worker[]; data?: Worker[] }>(endpoint, accessToken)
      .then((res) => {
        const list = res.content ?? res.data ?? (Array.isArray(res) ? res : []);
        setWorkers(list as Worker[]);
      })
      .catch((err) => {
        console.error('Failed to fetch workers:', err);
        setError(err instanceof Error ? err.message : 'Failed to load workers');
        setWorkers([]);
      })
      .finally(() => setLoading(false));
  }, [accessToken, complaint.departmentId]);

  const handleAssign = async () => {
    if (!selectedWorkerId) { setError('Select a worker'); return; }
    setSaving(true);
    setError('');
    try {
      await apiPost('/assignments/manual-assign', {
        complaintId: complaint.id,
        workerId: selectedWorkerId,
        deadlineHours: deadlineHours ? parseInt(deadlineHours, 10) : undefined
      }, accessToken ?? undefined);
      onAssigned();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assignment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Assign Worker</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginBottom: 12 }}>
            Assign a worker to: <strong>{complaint.title}</strong>
            {complaint.departmentName && (
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 4 }}>
                Showing workers from: <strong>{complaint.departmentName}</strong>
              </span>
            )}
          </p>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}><span className="spinner" /></div>
          ) : workers.length === 0 ? (
            <div className="auth-error">
              <AlertTriangle size={16} className="icon-inline" />
              {complaint.departmentId
                ? 'No workers in this department. Assign the complaint to a department first, or register workers.'
                : 'No workers available. Register workers first.'}
            </div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Select Worker</label>
                <select className="form-input" value={selectedWorkerId} onChange={(e) => setSelectedWorkerId(e.target.value)}>
                  <option value="">— Select —</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name ?? w.email ?? w.id} {w.departmentName ? `(${w.departmentName})` : ''} — {w.complaintsAssigned ?? 0} assigned
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Time to Complete (Hours)
                  <span style={{ color: 'var(--text-3)', fontWeight: 'normal', marginLeft: 6 }}>(optional — overrides priority-based SLA)</span>
                </label>
                <input
                  type="number" min="1" className="form-input"
                  value={deadlineHours}
                  onChange={(e) => setDeadlineHours(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 48"
                />
              </div>
            </>
          )}
          {error && <div className="auth-error"><AlertTriangle size={16} className="icon-inline" /> {error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => void handleAssign()} disabled={saving || !selectedWorkerId}>
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Assigning...</> : <><UserPlus size={16} className="icon-inline" /> Assign</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Detail Modal ───────────────────────────────────────────────────── */

interface DetailModalProps {
  complaint: Complaint;
  onClose: () => void;
  onStatusUpdate: (id: string, status: ComplaintStatus) => void;
  onRefresh: () => void;
}

function DetailModal({ complaint, onClose, onStatusUpdate, onRefresh }: DetailModalProps) {
  const [newStatus, setNewStatus] = useState<ComplaintStatus>(complaint.status);
  const [saving, setSaving] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [reopenRequests, setReopenRequests] = useState<ReopenRequest[]>([]);
  const [showAssignWorker, setShowAssignWorker] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;
    apiGet<ReopenRequest[]>(`/reopen-requests/complaint/${complaint.id}`, accessToken)
      .catch(() => [])
      .then((data) => setReopenRequests(Array.isArray(data) ? data : []));
  }, [complaint.id, accessToken]);

  const handleUpdate = async (targetStatus?: ComplaintStatus) => {
    const statusToSave = targetStatus || newStatus;
    if (statusToSave === complaint.status) { onClose(); return; }
    setSaving(true);
    try {
      await apiPut(`/complaints/${complaint.id}/status`, { status: statusToSave }, accessToken ?? undefined);
      onStatusUpdate(complaint.id, statusToSave);
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

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      await apiPost('/assignments/auto-assign', { complaintId: complaint.id }, accessToken ?? undefined);
      onStatusUpdate(complaint.id, 'ASSIGNED');
      onRefresh();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Auto-Assignment failed');
    } finally {
      setAutoAssigning(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Complaint Details</span>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
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
                <div className="mono text-accent" style={{ marginTop: 4, fontSize: '0.8rem' }}>{complaint.complaintNumber ?? complaint.id}</div>
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
                <div style={{ color: 'var(--text)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {complaint.assignedWorkerName ?? 'Unassigned'}
                  {!complaint.assignedWorkerName && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                        onClick={() => setShowAssignWorker(true)}>
                        <UserPlus size={12} className="icon-inline" /> Manual Assign
                      </button>
                      <button className="btn btn-sm btn-outline" style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                        onClick={() => void handleAutoAssign()} disabled={autoAssigning}>
                        {autoAssigning ? '...' : 'Auto Assign'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {(complaint.address || complaint.location) && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="form-label">Location</div>
                  <div style={{ color: 'var(--text-2)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={16} className="icon-inline" /> {complaint.address ?? complaint.location}
                    {complaint.latitude && complaint.longitude && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${complaint.latitude},${complaint.longitude}`} 
                        target="_blank" rel="noreferrer"
                        style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.8rem', marginLeft: 8 }}
                      >
                        [View on Map]
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {/* AI Reasoning & Methods */}
              {(complaint.verificationMethod || complaint.aiSummary) && (
                <div style={{ gridColumn: '1 / -1', background: 'var(--bg-2)', padding: 12, borderRadius: 8, marginTop: 8 }}>
                  <div className="form-label" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>✨</span> AI Verification
                  </div>
                  {complaint.verificationMethod && (
                    <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                      Method: <strong>{complaint.verificationMethod}</strong>
                    </div>
                  )}
                  {complaint.aiSummary && (
                    <div style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginTop: 6, fontStyle: 'italic' }}>
                      "{complaint.aiSummary}"
                    </div>
                  )}
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

            {/* Images Grid */}
            {complaint.imageUrls && complaint.imageUrls.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="form-label" style={{ marginBottom: 8 }}>Attached Images ({complaint.imageUrls.length})</div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                  {complaint.imageUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img 
                        src={url} 
                        alt={`Complaint attachment ${i+1}`} 
                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} 
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}


            {/* Resolution Images */}
            {complaint.resolutionImages && complaint.resolutionImages.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="form-label" style={{ marginBottom: 8 }}>Proof of Work ({complaint.resolutionImages.length})</div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                  {complaint.resolutionImages.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      {url.toLowerCase().endsWith('.mp4') || url.toLowerCase().includes('video') ? (
                        <div style={{ width: 100, height: 100, background: '#000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: '0.7rem' }}>▶ Play Video</span>
                        </div>
                      ) : (
                        <img 
                          src={url} 
                          alt={`Proof of work ${i+1}`} 
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} 
                        />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Citizen Feedback */}
            {complaint.rating !== undefined && complaint.rating !== null && complaint.rating > 0 && (
              <div style={{ marginTop: 16, background: 'var(--bg-2)', padding: 12, borderRadius: 8 }}>
                <div className="form-label" style={{ marginBottom: 4 }}>Citizen Feedback</div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} style={{ fontSize: 16, color: star <= complaint.rating! ? '#F59E0B' : '#CBD5E1' }}>★</span>
                  ))}
                </div>
                {complaint.feedback && (
                  <div style={{ color: 'var(--text-2)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    "{complaint.feedback}"
                  </div>
                )}
              </div>
            )}

            <div className="divider" />

            <div className="form-group">
              <label className="form-label">Update Status</label>
              <select className="form-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}>
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
                          onClick={() => void handleReopenAction(r.id, 'approve')}><Check size={16} className="icon-inline" /> Approve</button>
                        <button className="btn btn-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: 'none' }}
                          onClick={() => void handleReopenAction(r.id, 'reject')}><X size={16} className="icon-inline" /> Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            {!complaint.assignedWorkerName && complaint.status !== 'AI_REJECTED' && (
              <button className="btn btn-sm" style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: 'none' }}
                onClick={() => setShowAssignWorker(true)}>
                <UserPlus size={16} className="icon-inline" /> Assign Worker
              </button>
            )}
            {complaint.status === 'AI_REJECTED' && (
              <>
                <button className="btn btn-sm" style={{ background: 'var(--green-bg)', color: 'var(--green)', border: 'none' }}
                  onClick={() => void handleUpdate('VERIFIED')} disabled={saving}>
                  <Check size={16} className="icon-inline" /> Approve (Verify)
                </button>
                <button className="btn btn-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: 'none' }}
                  onClick={() => void handleUpdate('REJECTED')} disabled={saving}>
                  <X size={16} className="icon-inline" /> Reject (Invalid)
                </button>
              </>
            )}
            {!['RESOLVED', 'CLOSED', 'ESCALATED', 'AI_REJECTED'].includes(complaint.status) && (
              <button className="btn btn-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: 'none' }}
                onClick={() => void handleEscalate()} disabled={escalating}>
                {escalating ? '...' : <><AlertTriangle size={16} className="icon-inline" /> Escalate</>}
              </button>
            )}
            {complaint.status !== 'AI_REJECTED' && (
              <button className="btn btn-primary" onClick={() => void handleUpdate()} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : 'Update Status'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showAssignWorker && (
        <AssignWorkerModal
          complaint={complaint}
          onClose={() => setShowAssignWorker(false)}
          onAssigned={() => { onRefresh(); setShowAssignWorker(false); }}
        />
      )}
    </>
  );
}

/* ── Main Complaints Page ───────────────────────────────────────────── */

export default function ComplaintsPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [error, setError] = useState('');
  const PAGE_SIZE = 15;

  const [viewMode, setViewMode] = useState<'all' | 'reopens' | 'ai_queue'>('all');
  const [pendingReopens, setPendingReopens] = useState<ReopenRequest[]>([]);
  const [aiQueue, setAiQueue] = useState<Complaint[]>([]);

  const fetchComplaints = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      if (viewMode === 'all') {
        const params = new URLSearchParams({
          page: String(page),
          size: String(PAGE_SIZE),
          sort: 'createdAt,desc',
        });
        if (statusFilter) params.set('status', statusFilter);
        if (search.trim()) params.set('search', search.trim());

        const res = await apiGet<PagedResponse<Complaint>>(
          `/complaints?${params.toString()}`,
          accessToken
        );
        setComplaints(res.content ?? []);
        setTotal(res.totalElements ?? 0);
      } else if (viewMode === 'reopens') {
        const res = await apiGet<ReopenRequest[]>('/reopen-requests/pending', accessToken);
        setPendingReopens(res ?? []);
        setTotal(res?.length ?? 0);
      } else if (viewMode === 'ai_queue') {
        const params = new URLSearchParams({
          page: String(page),
          size: String(PAGE_SIZE),
          sort: 'createdAt,desc',
          status: 'AI_REJECTED'
        });
        const res = await apiGet<PagedResponse<Complaint>>(
          `/complaints?${params.toString()}`,
          accessToken
        );
        setAiQueue(res.content ?? []);
        setTotal(res.totalElements ?? 0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
      if (viewMode === 'all') setComplaints([]);
      else if (viewMode === 'reopens') setPendingReopens([]);
      else setAiQueue([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, statusFilter, search, viewMode]);

  useEffect(() => { void fetchComplaints(); }, [fetchComplaints]);

  const handleStatusUpdate = (id: string, status: ComplaintStatus) => {
    setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Complaints & Requests</h1>
          <p>{total.toLocaleString()} {viewMode === 'all' ? 'total complaints' : 'pending reopen requests'} in the system</p>
        </div>
        <div style={{ display: 'flex', gap: 8, background: 'var(--bg-2)', padding: 4, borderRadius: 8 }}>
          <button 
            className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => { setViewMode('all'); setPage(0); }}
          >
            All Complaints
          </button>
          <button 
            className={`btn ${viewMode === 'reopens' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => { setViewMode('reopens'); setPage(0); }}
          >
            Pending Reopens
          </button>
          <button 
            className={`btn ${viewMode === 'ai_queue' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => { setViewMode('ai_queue'); setPage(0); }}
          >
            Verification Queue
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters-bar">
          {viewMode === 'all' && (
            <>
              <div className="search-wrap">
                <span className="search-icon"><Search size={16} className="icon-inline" /></span>
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
            </>
          )}

          <button className="btn btn-ghost btn-sm" onClick={() => void fetchComplaints()}>
            <RefreshCw size={16} className="icon-inline" /> Refresh
          </button>

          {loading && <span className="spinner" />}
        </div>

        {error && (
          <div className="auth-error" style={{ margin: 16 }}>
            <AlertTriangle size={16} className="icon-inline" /> {error}
          </div>
        )}

        {viewMode === 'all' && complaints.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ClipboardList size={32} /></div>
            <h3>{error ? 'Connection error' : 'No complaints found'}</h3>
            <p>{error ? 'Check if the backend is running' : 'Try adjusting your filters or search query'}</p>
          </div>
        ) : viewMode === 'reopens' && pendingReopens.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Check size={32} /></div>
            <h3>No Pending Reopen Requests</h3>
            <p>All reopen requests have been addressed.</p>
          </div>
        ) : viewMode === 'ai_queue' && aiQueue.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Check size={32} /></div>
            <h3>No AI-Flagged Complaints</h3>
            <p>The verification queue is currently empty.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  {viewMode === 'all' || viewMode === 'ai_queue' ? (
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
                  ) : (
                    <tr>
                      <th>Reopen ID</th>
                      <th>Complaint ID</th>
                      <th>Reason</th>
                      <th>Count</th>
                      <th>Requested At</th>
                      <th></th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {(viewMode === 'all' ? complaints : viewMode === 'ai_queue' ? aiQueue : []).map((c) => (
                    <tr key={c.id}>
                      <td><span className="mono text-accent" style={{ fontSize: '0.75rem' }}>{c.complaintNumber ?? c.id.substring(0, 8)}</span></td>
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
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelected(c)}>
                          {viewMode === 'ai_queue' ? 'Review' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {viewMode === 'reopens' && pendingReopens.map((r) => (
                    <tr key={r.id}>
                      <td><span className="mono text-accent" style={{ fontSize: '0.75rem' }}>{r.id.substring(0, 8)}</span></td>
                      <td><span className="mono text-accent" style={{ fontSize: '0.75rem' }}>{r.complaintId?.substring(0, 8)}</span></td>
                      <td>{r.reason}</td>
                      <td>#{r.reopenCount}</td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>{formatDate(r.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm" style={{ background: 'var(--green-bg)', color: 'var(--green)', border: 'none' }}
                            onClick={async () => {
                              await apiPost(`/reopen-requests/${r.id}/approve`, {}, accessToken ?? undefined);
                              fetchComplaints();
                            }}><Check size={16} className="icon-inline" /> Approve</button>
                          <button className="btn btn-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: 'none' }}
                            onClick={async () => {
                              await apiPost(`/reopen-requests/${r.id}/reject`, {}, accessToken ?? undefined);
                              fetchComplaints();
                            }}><X size={16} className="icon-inline" /> Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(viewMode === 'all' || viewMode === 'ai_queue') && (
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
            )}
          </>
        )}
      </div>

      {selected && (
        <DetailModal
          complaint={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
          onRefresh={() => void fetchComplaints()}
        />
      )}
    </div>
  );
}
