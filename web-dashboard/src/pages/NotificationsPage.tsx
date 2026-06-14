import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useNotificationStore } from '../store';
import { apiGet } from '../services/api/client';
import { Notification } from '../types';
import { AlertTriangle, GitMerge, ClipboardList, Settings, CheckCircle2, AlertCircle, Bell, Check } from 'lucide-react';
import React from 'react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  ESCALATION: <AlertTriangle size={16} className="icon-inline" />,
  NEW_COMPLAINT: <ClipboardList size={16} className="icon-inline" />,
  ASSIGNMENT: <GitMerge size={16} className="icon-inline" />,
  RESOLVED: <CheckCircle2 size={16} className="icon-inline" />,
  OVERDUE: <AlertCircle size={16} className="icon-inline" />,
  SYSTEM: <Settings size={16} className="icon-inline" />,
};

const TYPE_COLORS: Record<string, string> = {
  ESCALATION: 'var(--red)',
  NEW_COMPLAINT: 'var(--blue)',
  ASSIGNMENT: 'var(--yellow)',
  RESOLVED: 'var(--green)',
  OVERDUE: 'var(--yellow)',
  SYSTEM: 'var(--text-3)',
};

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  if (diffM < 1) return 'Just now';
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const { notifications, setNotifications, markRead, markAllRead } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    apiGet<{ data?: Notification[]; content?: Notification[] }>('/notifications', accessToken, {
      'User-Id': user?.id ?? '',
    })
      .then((res) => {
        const list = res.data ?? res.content ?? (Array.isArray(res) ? res : []);
        setNotifications(list as Notification[]);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load notifications');
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, [accessToken, setNotifications]);

  const displayed = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>{t('notifications.title')}</h1>
          <p>{unreadCount > 0 ? `${unreadCount} ${t('notifications.unread_count')}` : t('notifications.all_caught_up')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={markAllRead}>
              <Check size={16} className="icon-inline" /> {t('notifications.mark_all_read')}
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `${t('notifications.tab_all')} (${notifications.length})` : `${t('notifications.tab_unread')} (${unreadCount})`}
          </button>
        ))}
        {loading && <span className="spinner" style={{ marginLeft: 8 }} />}
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 16 }}>
          <AlertTriangle size={16} className="icon-inline" /> {error}
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {displayed.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={32} /></div>
            <h3>{t('notifications.empty_title')}</h3>
            <p>{filter === 'unread' ? t('notifications.empty_desc_unread') : t('notifications.empty_desc_all')}</p>
          </div>
        ) : (
          <div>
            {displayed.map((n, i) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none',
                  background: n.read ? 'transparent' : 'rgba(20, 184, 166, 0.03)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onClick={() => !n.read && markRead(n.id)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-3)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = n.read ? 'transparent' : 'rgba(20, 184, 166, 0.03)'; }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--bg-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                  color: TYPE_COLORS[n.type ?? ''] ?? 'var(--text-3)',
                }}>
                  {TYPE_ICONS[n.type ?? ''] ?? <Bell size={16} className="icon-inline" />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: n.read ? 'var(--text-2)' : 'var(--text)',
                    fontWeight: n.read ? 400 : 500,
                    lineHeight: 1.5,
                  }}>
                    {n.message}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    {n.type && (
                      <span style={{
                        fontSize: '0.7rem',
                        color: TYPE_COLORS[n.type] ?? 'var(--text-3)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>
                        {n.type.replace(/_/g, ' ')}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent)',
                    flexShrink: 0, marginTop: 6,
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
