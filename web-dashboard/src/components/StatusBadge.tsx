import { ComplaintStatus, ComplaintPriority } from '../types';

export function StatusBadge({ status }: { status: ComplaintStatus | string }) {
  const cls = `badge badge-${status.toLowerCase().replace(/_/g, '_')}`;
  const labels: Record<string, string> = {
    SUBMITTED: 'Submitted',
    VERIFIED: 'Verified',
    ROUTED: 'Routed',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    REOPENED: 'Reopened',
    REJECTED: 'Rejected',
    ESCALATED: 'Escalated',
  };
  return <span className={cls}>{labels[status] ?? status}</span>;
}

export function PriorityBadge({ priority }: { priority: ComplaintPriority | string }) {
  const cls = `badge badge-${priority.toLowerCase()}`;
  const labels: Record<string, string> = {
    CRITICAL: '🔴 Critical',
    HIGH: '🟠 High',
    MEDIUM: '🟡 Medium',
    LOW: '🔵 Low',
    VERY_LOW: '⚪ Very Low',
  };
  return <span className={cls}>{labels[priority] ?? priority}</span>;
}

export function AssignmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'badge-submitted',
    ACKNOWLEDGED: 'badge-verified',
    IN_PROGRESS: 'badge-in_progress',
    COMPLETED: 'badge-resolved',
    ESCALATED: 'badge-escalated',
  };
  return <span className={`badge ${map[status] ?? 'badge-submitted'}`}>{status.replace(/_/g, ' ')}</span>;
}
