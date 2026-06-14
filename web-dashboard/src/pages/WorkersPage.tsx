import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store';
import { apiGet } from '../services/api/client';
import { PagedResponse, Worker } from '../types';
import { XCircle, CheckCircle2, HardHat, Search, BarChart3, AlertTriangle } from 'lucide-react';

export default function WorkersPage() {
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const fetchWorkers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<PagedResponse<Worker>>(`/workers?page=${page}&size=${PAGE_SIZE}`, accessToken);
      setWorkers(res.content ?? []);
      setTotal(res.totalElements ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workers');
      setWorkers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => { void fetchWorkers(); }, [fetchWorkers]);

  const departments = [...new Set(workers.map((w) => w.departmentName).filter(Boolean))];

  const filtered = workers.filter((w) => {
    const matchSearch = !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.email?.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || w.departmentName === deptFilter;
    return matchSearch && matchDept;
  });

  const available = workers.filter((w) => w.status === 'ACTIVE' || w.available).length;
  const avgLoad = workers.length > 0
    ? (workers.reduce((sum, w) => sum + (w.complaintsAssigned ?? 0), 0) / workers.length).toFixed(1)
    : '0';

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('workers.title')}</h1>
          <p>{t('workers.subtitle')}</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}><HardHat size={16} className="icon-inline" /></div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">{t('workers.stat_total')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}><CheckCircle2 size={16} style={{ color: 'var(--green)' }} className="icon-inline" /></div>
          <div className="stat-value">{available}</div>
          <div className="stat-label">{t('workers.stat_available')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}><XCircle size={16} style={{ color: 'var(--red)' }} className="icon-inline" /></div>
          <div className="stat-value">{total - available}</div>
          <div className="stat-label">{t('workers.stat_unavailable')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)' }}><BarChart3 size={16} className="icon-inline" /></div>
          <div className="stat-value">{avgLoad}</div>
          <div className="stat-label">{t('workers.stat_avg_load')}</div>
        </div>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-wrap">
            <span className="search-icon"><Search size={16} className="icon-inline" /></span>
            <input
              className="search-input"
              placeholder={t('workers.search_placeholder')}
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
            <option value="">{t('workers.filter_all_dept')}</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {loading && <span className="spinner" />}
        </div>

        {error && (
          <div className="auth-error" style={{ margin: 16 }}>
            <AlertTriangle size={16} className="icon-inline" /> {error}
          </div>
        )}

        {filtered.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon"><HardHat size={32} /></div>
            <h3>{t('workers.empty_title')}</h3>
            <p>{error ? t('workers.empty_desc_error') : t('workers.empty_desc_filter')}</p>
          </div>
        ) : (
          <>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('workers.col_worker')}</th>
                    <th>{t('workers.col_designation')}</th>
                    <th>{t('workers.col_department')}</th>
                    <th>{t('workers.col_status')}</th>
                    <th>{t('workers.col_assigned')}</th>
                    <th>{t('workers.col_workload')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w) => {
                    const load = w.complaintsAssigned ?? 0;
                    const loadPct = Math.min(100, (load / 10) * 100);
                    const loadColor = load >= 8 ? 'var(--red)' : load >= 5 ? 'var(--yellow)' : 'var(--green)';
                    const isAvailable = w.status === 'ACTIVE' || w.available;
                    
                    return (
                      <tr key={w.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.8rem', padding: 0, overflow: 'hidden' }}>
                              {w.profileImageUrl ? (
                                <img src={w.profileImageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                w.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'W'
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{w.name ?? t('workers.unknown_worker')}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{w.email ?? t('workers.no_email')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-muted">{w.designation ?? '—'}</td>
                        <td className="text-muted">{w.departmentName ?? '—'}</td>
                        <td>
                          <span className={`badge ${isAvailable ? 'badge-resolved' : 'badge-closed'}`}>
                            {isAvailable ? <><CheckCircle2 size={16} style={{ color: 'var(--green)' }} className="icon-inline" /> {t('workers.badge_active')}</> : <><XCircle size={16} style={{ color: 'var(--red)' }} className="icon-inline" /> {t('workers.badge_inactive')}</>}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: loadColor }}>{load}</span>
                          <span className="text-muted"> {t('workers.tasks_label')}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden', minWidth: 80 }}>
                              <div style={{ width: `${loadPct}%`, height: '100%', background: loadColor, borderRadius: 3, transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', minWidth: 28 }}>{load}/10</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
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
    </div>
  );
}
