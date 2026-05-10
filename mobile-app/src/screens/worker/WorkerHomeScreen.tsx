import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { useAuthStore } from '@store/index';
import { apiGet, apiPost } from '@services/api/client';
import { Assignment } from '@/types';

// Extend Assignment type for mobile
interface WorkerAssignment extends Assignment {
  complaintDescription?: string;
  complaintAddress?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#60a5fa',
  ACKNOWLEDGED: '#a78bfa',
  IN_PROGRESS: '#fb923c',
  COMPLETED: '#34d399',
  ESCALATED: '#f87171',
};

function isSlaBreached(deadline?: string) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function getSlaLabel(deadline?: string) {
  if (!deadline) return null;
  const breached = isSlaBreached(deadline);
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = Math.abs(d.getTime() - now.getTime());
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  return { breached, label: breached ? `${diffH}h ${diffM}m overdue` : `${diffH}h ${diffM}m left` };
}

interface AssignmentCardProps {
  assignment: WorkerAssignment;
  onAccept: (id: string) => void;
  onComplete: (id: string) => void;
}

function AssignmentCard({ assignment, onAccept, onComplete }: AssignmentCardProps) {
  const color = STATUS_COLORS[assignment.status] ?? '#64748b';
  const sla = getSlaLabel(assignment.slaDeadline);

  return (
    <View style={[styles.card, assignment.status === 'ESCALATED' && styles.cardEscalated]}>
      <View style={styles.cardTop}>
        <View style={[styles.statusPill, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.statusPillText, { color }]}>{assignment.status.replace(/_/g, ' ')}</Text>
        </View>
        {sla && (
          <Text style={[styles.slaText, { color: sla.breached ? '#f87171' : sla.label.includes('1h') ? '#fbbf24' : '#94A3B8' }]}>
            {sla.breached ? '🔴' : '🟡'} {sla.label}
          </Text>
        )}
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {assignment.complaintTitle ?? assignment.complaintId}
      </Text>

      {assignment.complaintAddress && (
        <Text style={styles.cardAddress} numberOfLines={1}>📍 {assignment.complaintAddress}</Text>
      )}

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>Dept: {assignment.departmentName ?? '—'}</Text>
        {assignment.priority && (
          <View style={styles.priorityTag}>
            <Text style={styles.priorityTagText}>{assignment.priority}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        {assignment.status === 'PENDING' && (
          <Pressable style={styles.actionBtn} onPress={() => onAccept(assignment.id)}>
            <Text style={styles.actionBtnText}>✓ Accept</Text>
          </Pressable>
        )}
        {assignment.status === 'IN_PROGRESS' && (
          <Pressable style={[styles.actionBtn, styles.actionBtnGreen]} onPress={() => onComplete(assignment.id)}>
            <Text style={[styles.actionBtnText, { color: '#065f46' }]}>✅ Mark Complete</Text>
          </Pressable>
        )}
        {assignment.status === 'ACKNOWLEDGED' && (
          <Pressable style={[styles.actionBtn, styles.actionBtnYellow]} onPress={() => onAccept(assignment.id)}>
            <Text style={[styles.actionBtnText, { color: '#92400e' }]}>🔧 Start Work</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function WorkerHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [assignments, setAssignments] = useState<WorkerAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const MOCK: WorkerAssignment[] = [
    { id: 'A-001', complaintId: 'C-1001', complaintTitle: 'Pothole on MG Road near bus stop', departmentId: 'd1', departmentName: 'Roads Department', status: 'PENDING', priority: 'HIGH', slaDeadline: new Date(Date.now() + 3600000 * 5).toISOString(), assignedAt: new Date().toISOString(), complaintAddress: 'MG Road, Bengaluru' },
    { id: 'A-004', complaintId: 'C-1007', complaintTitle: 'Road cave-in near school', departmentId: 'd1', departmentName: 'Roads Department', status: 'IN_PROGRESS', priority: 'CRITICAL', slaDeadline: new Date(Date.now() + 3600000 * 1).toISOString(), assignedAt: new Date().toISOString(), complaintAddress: 'Near Govt School, Koramangala' },
  ];

  const fetchAssignments = async (silent = false) => {
    if (!accessToken || !user) return;
    if (!silent) setLoading(true);
    try {
      const res = await apiGet<{ data: WorkerAssignment[] }>(
        `/assignments/worker/${user.id}?page=0&size=20`,
        accessToken
      );
      setAssignments(res.data ?? []);
    } catch {
      setAssignments(MOCK);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void fetchAssignments(); }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = () => { setRefreshing(true); void fetchAssignments(true); };

  const handleAccept = async (id: string) => {
    if (!accessToken) return;
    try {
      await apiPost(`/assignments/${id}/acknowledge`, {}, accessToken);
      setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const } : a));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to accept');
    }
  };

  const handleComplete = async (id: string) => {
    if (!accessToken) return;
    Alert.alert('Complete Task', 'Mark this assignment as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete', onPress: async () => {
          try {
            await apiPost(`/assignments/${id}/complete`, {}, accessToken);
            setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'COMPLETED' as const } : a));
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to complete');
          }
        }
      }
    ]);
  };

  const active = assignments.filter((a) => !['COMPLETED'].includes(a.status));
  const completed = assignments.filter((a) => a.status === 'COMPLETED');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F766E" />}
    >
      {/* Header */}
      <View style={styles.workerHeader}>
        <View>
          <Text style={styles.workerName}>{user?.name ?? 'Worker'}</Text>
          <Text style={styles.workerRole}>Field Worker</Text>
        </View>
        <Pressable style={styles.logoutBtn} onPress={() => void logout()}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Active', value: active.length, color: '#fbbf24' },
          { label: 'Completed', value: completed.length, color: '#34d399' },
          { label: 'Total', value: assignments.length, color: '#60a5fa' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Active Assignments */}
      <Text style={styles.sectionTitle}>Active Assignments ({active.length})</Text>

      {loading ? (
        <ActivityIndicator color="#0F766E" style={{ marginTop: 24 }} />
      ) : active.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>No active assignments right now</Text>
        </View>
      ) : (
        active.map((a) => (
          <AssignmentCard key={a.id} assignment={a} onAccept={handleAccept} onComplete={handleComplete} />
        ))
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Completed ({completed.length})</Text>
          {completed.map((a) => (
            <AssignmentCard key={a.id} assignment={a} onAccept={handleAccept} onComplete={handleComplete} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  content: { padding: 16, paddingBottom: 32 },
  workerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  workerName: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  workerRole: { fontSize: 13, color: '#64748B', marginTop: 2 },
  logoutBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  logoutText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '500' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  cardEscalated: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  slaText: { fontSize: 11, fontWeight: '500' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B', lineHeight: 20, marginBottom: 6 },
  cardAddress: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  metaText: { fontSize: 12, color: '#94A3B8' },
  priorityTag: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityTagText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, backgroundColor: '#EFF6FF', paddingVertical: 10, borderRadius: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE',
  },
  actionBtnGreen: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  actionBtnYellow: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});
