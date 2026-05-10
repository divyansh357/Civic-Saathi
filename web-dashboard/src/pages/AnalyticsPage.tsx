import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuthStore } from '../store';
import { apiGet } from '../services/api/client';

const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'var(--text)' },
  itemStyle: { color: 'var(--accent)' },
};

const MONTHLY_DATA = [
  { month: 'Dec', submitted: 98, resolved: 72, escalated: 8 },
  { month: 'Jan', submitted: 124, resolved: 95, escalated: 12 },
  { month: 'Feb', submitted: 143, resolved: 118, escalated: 9 },
  { month: 'Mar', submitted: 167, resolved: 142, escalated: 15 },
  { month: 'Apr', submitted: 189, resolved: 161, escalated: 11 },
  { month: 'May', submitted: 213, resolved: 178, escalated: 18 },
];

const DEPT_PERFORMANCE = [
  { name: 'Roads', resolved: 89, slaBreached: 11, avgHours: 24 },
  { name: 'Water', resolved: 94, slaBreached: 6, avgHours: 18 },
  { name: 'Sanitation', resolved: 76, slaBreached: 24, avgHours: 36 },
  { name: 'Electricity', resolved: 82, slaBreached: 18, avgHours: 28 },
  { name: 'Parks', resolved: 91, slaBreached: 9, avgHours: 48 },
];

const CATEGORY_PIE = [
  { name: 'Roads', value: 312, color: '#60a5fa' },
  { name: 'Water', value: 245, color: '#34d399' },
  { name: 'Sanitation', value: 198, color: '#fbbf24' },
  { name: 'Electricity', value: 167, color: '#a78bfa' },
  { name: 'Parks', value: 89, color: '#fb923c' },
  { name: 'Other', value: 273, color: '#64748b' },
];

export default function AnalyticsPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    apiGet('/analytics/dashboard', accessToken)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Analytics</h1>
          <p>Platform performance metrics and trends</p>
        </div>
        {loading && <span className="spinner" />}
      </div>

      {/* KPI Row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Resolution Rate', value: '83.4%', icon: '✅', color: 'var(--green)', bg: 'var(--green-bg)', change: '+2.1%', up: true },
          { label: 'Avg Resolution Time', value: '28.4h', icon: '⏱️', color: 'var(--blue)', bg: 'var(--blue-bg)', change: '-3.2h', up: true },
          { label: 'SLA Compliance', value: '87.7%', icon: '📋', color: 'var(--accent)', bg: 'var(--accent-glow)', change: '+1.4%', up: true },
          { label: 'Escalation Rate', value: '12.3%', icon: '🚨', color: 'var(--red)', bg: 'var(--red-bg)', change: '+0.8%', up: false },
          { label: 'Citizen Satisfaction', value: '4.2/5', icon: '⭐', color: 'var(--yellow)', bg: 'var(--yellow-bg)', change: '+0.3', up: true },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-change ${s.up ? 'up' : 'down'}`}>
              {s.up ? '↑' : '↓'} {s.change} vs last month
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Monthly Trend */}
        <div className="card full">
          <div className="card-header">
            <div>
              <div className="card-title">Monthly Complaint Trends</div>
              <div className="card-subtitle">Submitted vs Resolved vs Escalated</div>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_DATA} margin={{ top: 4, right: 16, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend formatter={(v) => <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{v}</span>} />
                <Line type="monotone" dataKey="submitted" stroke="var(--blue)" strokeWidth={2} dot={{ r: 3 }} name="Submitted" />
                <Line type="monotone" dataKey="resolved" stroke="var(--green)" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
                <Line type="monotone" dataKey="escalated" stroke="var(--red)" strokeWidth={2} dot={{ r: 3 }} name="Escalated" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Performance */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Department Resolution Rate</div>
              <div className="card-subtitle">% of complaints resolved on time</div>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEPT_PERFORMANCE} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 20 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Resolution Rate']} />
                <Bar dataKey="resolved" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Complaints by Category</div>
              <div className="card-subtitle">All-time distribution</div>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CATEGORY_PIE} cx="50%" cy="50%" outerRadius={75} paddingAngle={2} dataKey="value">
                  {CATEGORY_PIE.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department SLA Table */}
        <div className="card full">
          <div className="card-header">
            <div>
              <div className="card-title">Department Performance Summary</div>
              <div className="card-subtitle">SLA compliance and resolution times</div>
            </div>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Resolution Rate</th>
                  <th>SLA Breaches</th>
                  <th>Avg Resolution Time</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {DEPT_PERFORMANCE.map((d) => {
                  const perf = d.resolved >= 90 ? 'Excellent' : d.resolved >= 80 ? 'Good' : 'Needs Improvement';
                  const perfColor = d.resolved >= 90 ? 'var(--green)' : d.resolved >= 80 ? 'var(--yellow)' : 'var(--red)';
                  return (
                    <tr key={d.name}>
                      <td>{d.name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden', maxWidth: 100 }}>
                            <div style={{ width: `${d.resolved}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                          </div>
                          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{d.resolved}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: d.slaBreached > 15 ? 'var(--red)' : 'var(--text-2)' }}>
                          {d.slaBreached}%
                        </span>
                      </td>
                      <td className="text-muted">{d.avgHours}h avg</td>
                      <td>
                        <span style={{ color: perfColor, fontWeight: 600, fontSize: '0.82rem' }}>{perf}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
