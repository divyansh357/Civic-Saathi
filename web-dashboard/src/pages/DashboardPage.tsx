import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuthStore } from '../store';
import { apiGet } from '../services/api/client';
import { AnalyticsDashboard, Complaint } from '../types';
import { StatusBadge } from '../components/StatusBadge';

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#60a5fa',
  VERIFIED: '#a78bfa',
  ASSIGNED: '#fbbf24',
  IN_PROGRESS: '#fb923c',
  RESOLVED: '#34d399',
  CLOSED: '#64748b',
  ESCALATED: '#f87171',
};

const MOCK_ANALYTICS: AnalyticsDashboard = {
  totalComplaints: 1284,
  openComplaints: 342,
  resolvedComplaints: 891,
  escalatedComplaints: 51,
  avgResolutionHours: 28.4,
  slaBreachRate: 12.3,
  complaintsByStatus: {
    SUBMITTED: 120, VERIFIED: 85, ASSIGNED: 137, IN_PROGRESS: 0,
    RESOLVED: 891, CLOSED: 0, ESCALATED: 51
  },
  complaintsByCategory: {
    'Roads': 312, 'Water': 245, 'Sanitation': 198,
    'Electricity': 167, 'Parks': 89, 'Other': 273
  }
};

const MOCK_RECENT: Complaint[] = [
  { id: 'C-1001', title: 'Pothole on MG Road', status: 'ASSIGNED', priority: 'HIGH', category: 'Roads', userName: 'Rahul Sharma', createdAt: '2026-05-10T08:30:00' },
  { id: 'C-1002', title: 'Water supply disruption', status: 'IN_PROGRESS', priority: 'CRITICAL', category: 'Water', userName: 'Priya Patel', createdAt: '2026-05-10T07:15:00' },
  { id: 'C-1003', title: 'Broken street light', status: 'SUBMITTED', priority: 'MEDIUM', category: 'Electricity', userName: 'Amit Kumar', createdAt: '2026-05-10T06:45:00' },
  { id: 'C-1004', title: 'Garbage not collected', status: 'ESCALATED', priority: 'HIGH', category: 'Sanitation', userName: 'Sunita Devi', createdAt: '2026-05-09T22:00:00' },
  { id: 'C-1005', title: 'Park bench damaged', status: 'RESOLVED', priority: 'LOW', category: 'Parks', userName: 'Vikram Singh', createdAt: '2026-05-09T18:30:00' },
];

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard>(MOCK_ANALYTICS);
  const [recent, setRecent] = useState<Complaint[]>(MOCK_RECENT);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      apiGet<{ data: AnalyticsDashboard }>('/analytics/dashboard', accessToken).catch(() => null),
      apiGet<{ data: Complaint[] }>('/complaints?page=0&size=5&sortBy=createdAt&sortDir=DESC', accessToken).catch(() => null),
    ]).then(([analyticsRes, complaintsRes]) => {
      if (analyticsRes?.data) setAnalytics(analyticsRes.data);
      if (complaintsRes?.data) setRecent(complaintsRes.data);
    }).finally(() => setLoading(false));
  }, [accessToken]);

  const statusData = Object.entries(analytics.complaintsByStatus ?? {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const categoryData = Object.entries(analytics.complaintsByDepartment ?? analytics.complaintsByCategory ?? {})
    .map(([name, value]) => ({ name, value }));

  const statCards = [
    { label: 'Total Complaints', value: analytics.totalComplaints ?? 0, icon: '📋', color: 'var(--blue)', bg: 'var(--blue-bg)' },
    { label: 'Open / Active', value: analytics.openComplaints ?? 0, icon: '🔄', color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
    { label: 'Resolved', value: analytics.resolvedComplaints ?? 0, icon: '✅', color: 'var(--green)', bg: 'var(--green-bg)' },
    { label: 'Escalated', value: analytics.escalatedComplaints ?? 0, icon: '🚨', color: 'var(--red)', bg: 'var(--red-bg)' },
    { label: 'Avg Resolution', value: `${analytics.averageResolutionTime ?? analytics.avgResolutionHours ?? 0}h`, icon: '⏱️', color: 'var(--purple)', bg: 'var(--purple-bg)' },
    { label: 'SLA Breach Rate', value: `${analytics.slaBreachRate ?? 0}%`, icon: '⚠️', color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
                <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card full">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Complaints</div>
              <div className="card-subtitle">Latest submissions across the city</div>
            </div>
          </div>
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
                    <td><span className="mono text-accent">{c.id}</span></td>
                    <td className="truncate" style={{ maxWidth: 200 }}>{c.title}</td>
                    <td><span className="badge" style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}>{c.category}</span></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      {c.priority && (
                        <span className={`badge badge-${c.priority.toLowerCase()}`}>{c.priority}</span>
                      )}
                    </td>
                    <td>{c.userName ?? '—'}</td>
                    <td className="text-muted">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
