import { ComplaintStatus } from '../types';
import { Circle } from 'lucide-react';

export function StatusBadge({ status }: { status: ComplaintStatus | string }) {
  const str = String(status ?? '');
  const cls = 'badge badge-' + str.toLowerCase().replace(/_/g, '_');
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
  return <span className={cls}>{labels[str] ?? str}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const str = String(priority ?? 'MEDIUM').toUpperCase();
  const cls = 'badge badge-' + str.toLowerCase();
  
  const iconColors: Record<string, string> = {
    CRITICAL: '#DC2626',
    HIGH: '#F97316',
    MEDIUM: '#EAB308',
    LOW: '#3B82F6',
    VERY_LOW: '#94A3B8',
  };

  const labels: Record<string, string> = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    VERY_LOW: 'Very Low',
  };

  const color = iconColors[str] ?? '#94A3B8';

  return (
    <span className={cls} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <Circle size={10} fill={color} color={color} />
      {labels[str] ?? str}
    </span>
  );
}

export function AssignmentStatusBadge({ status }: { status: string }) {
  const str = String(status ?? '');
  const map: Record<string, string> = {
    PENDING: 'badge-submitted',
    ASSIGNED: 'badge-assigned',
    ACKNOWLEDGED: 'badge-verified',
    ACCEPTED: 'badge-verified',
    IN_PROGRESS: 'badge-in_progress',
    COMPLETED: 'badge-resolved',
    ESCALATED: 'badge-escalated',
    CANCELLED: 'badge-rejected',
    REJECTED: 'badge-rejected',
  };
  return <span className={'badge ' + (map[str] ?? 'badge-submitted')}>{str.replace(/_/g, ' ')}</span>;
}
