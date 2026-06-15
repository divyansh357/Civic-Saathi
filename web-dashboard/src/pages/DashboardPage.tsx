
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuthStore } from '../store';
import { apiGet } from '../services/api/client';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsDashboard, Complaint, PagedResponse } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { AlertTriangle, ClipboardList, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#60a5fa',
  VERIFIED: '#a78bfa',
  ASSIGNED: '#fbbf24',
  IN_PROGRESS: '#fb923c',
  RESOLVED: '#34d399',
  CLOSED: '#64748b',
  ESCALATED: '#f87171',
  REOPENED: '#c084fc',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const { data: analytics = {}, isLoading: analyticsLoading, error: queryError } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => apiGet<AnalyticsDashboard>('/analytics/dashboard', accessToken!),
    enabled: !!accessToken,
  });

  const { data: complaintsRes, isLoading: complaintsLoading } = useQuery({
    queryKey: ['recent-complaints'],
    queryFn: () => apiGet<PagedResponse<Complaint>>('/complaints?page=0&size=5&sort=createdAt,desc', accessToken!),
    enabled: !!accessToken,
  });

  const recent = complaintsRes?.content ?? [];
  const loading = analyticsLoading || complaintsLoading;
  const error = queryError ? (queryError as Error).message : '';

  const statusData = Object.entries(analytics.complaintsByStatus ?? {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const categoryData = Object.entries(analytics.complaintsByDepartment ?? analytics.complaintsByCategory ?? {})
    .map(([name, value]) => ({ name, value }));

  const statCards = [
    { label: t('dashboard.stat_total_complaints'), value: analytics.totalComplaints ?? 0, icon: <ClipboardList size={24} color="var(--blue)" />, color: 'var(--blue)', bg: 'var(--blue-bg)' },
    { label: t('dashboard.stat_open_active'), value: analytics.openComplaints ?? 0, icon: <RefreshCw size={24} color="var(--yellow)" />, color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
    { label: t('dashboard.stat_resolved'), value: analytics.resolvedComplaints ?? 0, icon: <CheckCircle2 size={24} color="var(--green)" />, color: 'var(--green)', bg: 'var(--green-bg)' },
    { label: t('dashboard.stat_escalated'), value: analytics.escalatedComplaints ?? 0, icon: <AlertTriangle size={24} color="var(--red)" />, color: 'var(--red)', bg: 'var(--red-bg)' },
    { label: t('dashboard.stat_avg_resolution'), value: `${analytics.averageResolutionTime ?? analytics.avgResolutionHours ?? 0}h`, icon: <Clock size={24} color="var(--purple)" />, color: 'var(--purple)', bg: 'var(--purple-bg)' },
    { label: t('dashboard.stat_sla_breach'), value: `${analytics.slaBreachRate ?? 0}%`, icon: <AlertTriangle size={24} color="var(--yellow)" />, color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('dashboard.title')}</h1>
          <p>{t('dashboard.welcome', { name: user?.name?.split(' ')[0] ?? 'Admin' })}</p>
        </div>
        {loading && <span className="spinner" />}
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 16 }}>
          <AlertTriangle size={16} className="icon-inline" /> {error}
        </div>
      )}

      <div className="stats-grid">
        {statCards.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{t('dashboard.card_category_title')}</div>
              <div className="card-subtitle">{t('dashboard.card_category_subtitle')}</div>
            </div>
          </div>
          <div className="chart-container">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'var(--text)' }} itemStyle={{ color: 'var(--accent)' }} />
                  <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)' }}>
                {t('dashboard.no_category_data')}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{t('dashboard.card_status_title')}</div>
              <div className="card-subtitle">{t('dashboard.card_status_subtitle')}</div>
            </div>
          </div>
          <div className="chart-container">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'var(--text)' }} />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)' }}>
                {t('dashboard.no_status_data')}
              </div>
            )}
          </div>
        </div>

        <div className="card full">
          <div className="card-header">
            <div>
              <div className="card-title">{t('dashboard.card_recent_title')}</div>
              <div className="card-subtitle">{t('dashboard.card_recent_subtitle')}</div>
            </div>
          </div>
          {recent.length > 0 ? (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('complaints.table_id')}</th>
                    <th>{t('complaints.table_title')}</th>
                    <th>{t('complaints.table_category')}</th>
                    <th>{t('complaints.table_status')}</th>
                    <th>{t('complaints.table_priority')}</th>
                    <th>{t('complaints.table_citizen')}</th>
                    <th>{t('complaints.table_created')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c) => (
                    <tr key={c.id}>
                      <td><span className="mono text-accent" style={{ fontSize: '0.75rem' }}>{c.complaintNumber ?? c.id.substring(0, 8)}</span></td>
                      <td className="truncate" style={{ maxWidth: 200 }}>{c.title}</td>
                      <td><span className="badge" style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}>{c.category ?? '—'}</span></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{c.priority ? <PriorityBadge priority={c.priority} /> : '—'}</td>
                      <td>{c.userName ?? '—'}</td>
                      <td className="text-muted">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
              {loading ? t('dashboard.loading') : t('dashboard.no_complaints')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
