import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuthStore } from '../store';
import { apiGet } from '../services/api/client';
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
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard>({});
  const [recent, setRecent] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    Promise.all([
      apiGet<AnalyticsDashboard>('/complaints/stats/overview', accessToken).catch(() => null),
      apiGet<PagedResponse<Complaint>>('/complaints?page=0&size=5&sort=createdAt,desc', accessToken).catch(() => null),
    ]).then(([analyticsRes, complaintsRes]) => {
      if (analyticsRes) setAnalytics(analyticsRes);
      if (complaintsRes?.content) setRecent(complaintsRes.content);
    }).catch((e) => {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    }).finally(() => setLoading(false));
  }, [accessToken]);

  const statusData = Object.entries(analytics.complaintsByStatus ?? {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const categoryData = Object.entries(analytics.complaintsByDepartment ?? analytics.complaintsByCategory ?? {})
    .map(([name, value]) => ({ name, value }));

  const statCards = [
    { label: 'Total Complaints', value: analytics.totalComplaints ?? 0, icon: <ClipboardList size={24} color="var(--blue)" />, color: 'var(--blue)', bg: 'var(--blue-bg)' },
    { label: 'Open / Active', value: analytics.openComplaints ?? 0, icon: <RefreshCw size={24} color="var(--yellow)" />, color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
    { label: 'Resolved', value: analytics.resolvedComplaints ?? 0, icon: <CheckCircle2 size={24} color="var(--green)" />, color: 'var(--green)', bg: 'var(--green-bg)' },
    { label: 'Escalated', value: analytics.escalatedComplaints ?? 0, icon: <AlertTriangle size={24} color="var(--red)" />, color: 'var(--red)', bg: 'var(--red-bg)' },
    { label: 'Avg Resolution', value: `${analytics.averageResolutionTime ?? analytics.avgResolutionHours ?? 0}h`, icon: <Clock size={24} color="var(--purple)" />, color: 'var(--purple)', bg: 'var(--purple-bg)' },
    { label: 'SLA Breach Rate', value: `${analytics.slaBreachRate ?? 0}%`, icon: <AlertTriangle size={24} color="var(--yellow)" />, color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name}. Here's what's happening today.</p>
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
              <div className="card-title">Complaints by Category</div>
              <div className="card-subtitle">Distribution across departments</div>
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
                No category data yet
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Status Breakdown</div>
              <div className="card-subtitle">Current complaint states</div>
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
                No status data yet
              </div>
            )}
          </div>
        </div>

        <div className="card full">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Complaints</div>
              <div className="card-subtitle">Latest submissions across the city</div>
            </div>
          </div>
          {recent.length > 0 ? (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Citizen</th>
                    <th>Submitted</th>
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
              {loading ? 'Loading...' : 'No complaints yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
