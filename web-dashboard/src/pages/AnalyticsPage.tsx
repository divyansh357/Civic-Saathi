import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuthStore } from '../store';
import { apiGet } from '../services/api/client';
import { AlertTriangle, ClipboardList , CheckCircle2, Clock, Star, TrendingUp, TrendingDown, Bot } from 'lucide-react';

const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'var(--text)' },
  itemStyle: { color: 'var(--accent)' },
};

interface HeatmapPoint { ward: string; count: number; lat: number; lng: number; }
interface DeptRanking { department: string; total: number; resolutionRate: number; performance: string; rank: number; }

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
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [deptRanking, setDeptRanking] = useState<DeptRanking[]>([]);
  const [aiStatus, setAiStatus] = useState<{ llmAvailable: boolean; provider: string } | null>(null);

  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.allSettled([
      apiGet<HeatmapPoint[]>('/analytics/heatmap', accessToken),
      apiGet<DeptRanking[]>('/analytics/departments/ranking', accessToken),
      apiGet<{ llmAvailable: boolean; provider: string }>('/ai/status', accessToken),
    ]).then(([heatmapRes, rankingRes, statusRes]) => {
      if (heatmapRes.status === 'fulfilled') setHeatmapData(heatmapRes.value);
      if (rankingRes.status === 'fulfilled') setDeptRanking(rankingRes.value);
      if (statusRes.status === 'fulfilled') setAiStatus(statusRes.value);
    }).finally(() => setLoading(false));
  }, [accessToken]);

  const fetchAiInsights = async () => {
    if (!accessToken) return;
    setLoadingInsights(true);
    try {
      const res = await apiGet<{ insights: string }>('/ai/insights?scope=all', accessToken);
      setAiInsights(res.insights);
    } catch (e) {
      console.error(e);
      setAiInsights(t('analytics.ai_failed'));
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('analytics.title')}</h1>
          <p>{t('analytics.subtitle')}</p>
        </div>
        {loading && <span className="spinner" />}
      </div>

      {/* KPI Row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: t('analytics.resolution_rate'), value: '83.4%', icon: <CheckCircle2 size={24} color="var(--green)" />, color: 'var(--green)', bg: 'var(--green-bg)', change: '+2.1%', up: true },
          { label: t('analytics.avg_resolution_time'), value: '28.4h', icon: <Clock size={24} color="var(--blue)" />, color: 'var(--blue)', bg: 'var(--blue-bg)', change: '-3.2h', up: true },
          { label: t('analytics.sla_compliance'), value: '87.7%', icon: <ClipboardList size={16} className="icon-inline" />, color: 'var(--accent)', bg: 'var(--accent-glow)', change: '+1.4%', up: true },
          { label: t('analytics.escalation_rate'), value: '12.3%', icon: <AlertTriangle size={16} className="icon-inline" />, color: 'var(--red)', bg: 'var(--red-bg)', change: '+0.8%', up: false },
          { label: t('analytics.citizen_satisfaction'), value: '4.2/5', icon: <Star size={24} color="var(--yellow)" />, color: 'var(--yellow)', bg: 'var(--yellow-bg)', change: '+0.3', up: true },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-change ${s.up ? 'up' : 'down'}`}>
              {s.up ? <TrendingUp size={14} className="icon-inline" /> : <TrendingDown size={14} className="icon-inline" />} {s.change} {t('analytics.vs_last_month')}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Monthly Trend */}
        <div className="card full">
          <div className="card-header">
            <div>
              <div className="card-title">{t('analytics.monthly_trends')}</div>
              <div className="card-subtitle">{t('analytics.monthly_trends_sub')}</div>
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
              <div className="card-title">{t('analytics.dept_resolution')}</div>
              <div className="card-subtitle">{t('analytics.dept_resolution_sub')}</div>
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
              <div className="card-title">{t('analytics.category_dist')}</div>
              <div className="card-subtitle">{t('analytics.category_dist_sub')}</div>
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
              <div className="card-title">{t('analytics.dept_perf')}</div>
              <div className="card-subtitle">{t('analytics.dept_perf_sub')}</div>
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

        {/* AI Insights Panel */}
        <div className="card full" style={{ background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%)', border: '1px solid var(--accent-glow)' }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={20} className="text-accent" /> {t('analytics.ai_insights')}
              </div>
              <div className="card-subtitle">{t('analytics.ai_insights_sub')}</div>
            </div>
            {!aiInsights && (
              <button className="btn btn-primary btn-sm" onClick={() => void fetchAiInsights()} disabled={loadingInsights || !aiStatus?.llmAvailable}>
                {loadingInsights ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Bot size={14} className="icon-inline" /> {t('analytics.generate_insights')}</>}
              </button>
            )}
          </div>
          {aiInsights ? (
            <div style={{
              background: 'var(--bg)', borderRadius: 12, padding: '20px',
              border: '1px solid var(--border)', marginTop: 16,
              color: 'var(--text)', lineHeight: 1.6, fontSize: '0.95rem'
            }} className="markdown-container">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiInsights}
              </ReactMarkdown>
            </div>
          ) : (
            <div style={{ color: 'var(--text-3)', fontSize: '0.85rem', padding: '8px 0', marginTop: 16 }}>
              {!aiStatus?.llmAvailable ? t('analytics.ai_unconfigured') : t('analytics.ai_prompt')}
            </div>
          )}
        </div>

        {/* Heatmap — Ward-level complaint distribution */}
        {heatmapData.length > 0 && (
          <div className="card full">
            <div className="card-header">
              <div>
                <div className="card-title">{t('analytics.heatmap_title')}</div>
                <div className="card-subtitle">{t('analytics.heatmap_sub')}</div>
              </div>
            </div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <XAxis dataKey="lng" name="Longitude" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v.toFixed(3)} />
                  <YAxis dataKey="lat" name="Latitude" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v.toFixed(3)} />
                  <ZAxis dataKey="count" range={[40, 400]} name="Complaints" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Scatter
                    data={heatmapData}
                    fill="var(--accent)"
                    fillOpacity={0.7}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            {/* Ward table */}
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, marginTop: 8 }}>
              <table>
                <thead>
                  <tr><th>Ward</th><th>Complaints</th><th>Volume</th></tr>
                </thead>
                <tbody>
                  {[...heatmapData].sort((a, b) => b.count - a.count).map((w) => {
                    const maxCount = Math.max(...heatmapData.map((x) => x.count));
                    const pct = Math.round((w.count / maxCount) * 100);
                    return (
                      <tr key={w.ward}>
                        <td>{w.ward}</td>
                        <td><span style={{ fontWeight: 600, color: 'var(--accent)' }}>{w.count}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden', maxWidth: 120 }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Department Ranking (from real API) */}
        {deptRanking.length > 0 && (
          <div className="card full">
            <div className="card-header">
              <div>
                <div className="card-title">{t('analytics.dept_ranking')}</div>
                <div className="card-subtitle">{t('analytics.dept_ranking_sub')}</div>
              </div>
            </div>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr><th>#</th><th>Department</th><th>Total Complaints</th><th>Resolution Rate</th><th>Performance</th></tr>
                </thead>
                <tbody>
                  {deptRanking.map((d) => {
                    const perfColor = d.performance === 'Excellent' ? 'var(--green)' : d.performance === 'Good' ? 'var(--yellow)' : 'var(--red)';
                    return (
                      <tr key={d.department}>
                        <td><span style={{ fontWeight: 700, color: d.rank <= 3 ? 'var(--accent)' : 'var(--text-3)' }}>#{d.rank}</span></td>
                        <td style={{ fontWeight: 600 }}>{d.department}</td>
                        <td className="text-muted">{d.total}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden', maxWidth: 100 }}>
                              <div style={{ width: `${d.resolutionRate}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontWeight: 600 }}>{d.resolutionRate}%</span>
                          </div>
                        </td>
                        <td><span style={{ color: perfColor, fontWeight: 600, fontSize: '0.82rem' }}>{d.performance}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



