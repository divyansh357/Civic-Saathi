import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, ActivityIndicator, TextInput
} from 'react-native';
import { useAuthStore } from '@store/index';
import { apiPost } from '@services/api/client';
import { Complaint } from '@/types';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#60a5fa', VERIFIED: '#a78bfa', ASSIGNED: '#fbbf24',
  IN_PROGRESS: '#fb923c', RESOLVED: '#34d399', CLOSED: '#64748b',
  ESCALATED: '#f87171', REOPENED: '#fbbf24',
};

const TIMELINE_STEPS = [
  { status: 'SUBMITTED', label: 'Submitted', icon: <Ionicons name="clipboard-outline" size={20} color="#64748b" /> },
  { status: 'VERIFIED', label: 'Verified', icon: '✓' },
  { status: 'ASSIGNED', label: 'Assigned', icon: <Ionicons name="git-network-outline" size={20} color="#64748b" /> },
  { status: 'IN_PROGRESS', label: 'In Progress', icon: '🔧' },
  { status: 'RESOLVED', label: 'Resolved', icon: '✅' },
  { status: 'CLOSED', label: 'Closed', icon: <Ionicons name="lock-closed-outline" size={20} color="#64748b" /> },
];

const STATUS_ORDER = ['SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  complaint: Complaint;
  onBack: () => void;
  onFeedback?: (complaint: Complaint) => void;
}

export default function ComplaintDetailScreen({ complaint, onBack, onFeedback }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const color = STATUS_COLORS[complaint.status] ?? '#64748b';
  const currentStep = STATUS_ORDER.indexOf(complaint.status);
  const [reopening, setReopening] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenForm, setShowReopenForm] = useState(false);

  const userRole = useAuthStore((s) => s.user?.role);
  const isCitizen = userRole === 'CITIZEN';

  const canRequestFeedback = isCitizen && (complaint.status === 'RESOLVED' || complaint.status === 'CLOSED');
  const canReopen = isCitizen && (complaint.status === 'RESOLVED' || complaint.status === 'CLOSED');

  const handleReopenRequest = async () => {
    if (!reopenReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for reopening this complaint.');
      return;
    }
    if (!accessToken) return;
    setReopening(true);
    try {
      await apiPost(
        '/reopen-requests',
        { complaintId: complaint.id, reason: reopenReason.trim() },
        accessToken
      );
      Alert.alert('Request Submitted', 'Your reopen request has been submitted for review.');
      setShowReopenForm(false);
      setReopenReason('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit reopen request.');
    } finally {
      setReopening(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Complaint Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[styles.statusLabel, { color }]}>
            {complaint.status.replace(/_/g, ' ')}
          </Text>
        </View>

        {/* Title & ID */}
        <View style={styles.card}>
          <Text style={styles.complaintId}>{complaint.id}</Text>
          <Text style={styles.complaintTitle}>{complaint.title}</Text>
          <View style={styles.tagsRow}>
            {complaint.category && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{complaint.category}</Text>
              </View>
            )}
            {complaint.priority && (
              <View style={[styles.tag, { backgroundColor: `${color}15` }]}>
                <Text style={[styles.tagText, { color }]}>{complaint.priority}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progress</Text>
          <View style={styles.timeline}>
            {TIMELINE_STEPS.map((step, i) => {
              const stepIdx = STATUS_ORDER.indexOf(step.status);
              const done = stepIdx <= currentStep;
              const active = stepIdx === currentStep;
              return (
                <View key={step.status} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineCircle,
                      done && styles.timelineCircleDone,
                      active && styles.timelineCircleActive,
                    ]}>
                      <Text style={[styles.timelineIcon, done && { color: '#fff' }]}>
                        {done ? (active ? step.icon : '✓') : step.icon}
                      </Text>
                    </View>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <View style={[styles.timelineLine, done && styles.timelineLineDone]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineLabel, active && styles.timelineLabelActive]}>
                      {step.label}
                    </Text>
                    {active && (
                      <Text style={styles.timelineDate}>{formatDate(complaint.updatedAt)}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          {complaint.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{complaint.description}</Text>
            </View>
          )}
          {complaint.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}><Ionicons name="location-outline" size={20} color="#64748b" /> Location</Text>
              <Text style={styles.detailValue}>{complaint.address}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Department</Text>
            <Text style={styles.detailValue}>{complaint.departmentName ?? 'Pending assignment'}</Text>
          </View>
          {complaint.assignedWorkerName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned Worker</Text>
              <Text style={styles.detailValue}>{complaint.assignedWorkerName}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted</Text>
            <Text style={styles.detailValue}>{formatDate(complaint.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>{formatDate(complaint.updatedAt)}</Text>
          </View>
        </View>

        {/* Resolved — feedback CTA */}
        {canRequestFeedback && (
          <View style={[styles.card, styles.resolvedCard]}>
            <Text style={styles.resolvedEmoji}>🎉</Text>
            <Text style={styles.resolvedTitle}>Issue Resolved!</Text>
            <Text style={styles.resolvedSubtitle}>
              This complaint has been resolved. How was your experience?
            </Text>
            {onFeedback && (
              <Pressable style={styles.feedbackBtn} onPress={() => onFeedback(complaint)}>
                <Text style={styles.feedbackBtnText}>⭐ Rate Resolution</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Reopen request */}
        {canReopen && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Not satisfied?</Text>
            <Text style={styles.reopenSubtitle}>
              If the issue was not properly resolved, you can request to reopen it.
            </Text>
            {!showReopenForm ? (
              <Pressable style={styles.reopenBtn} onPress={() => setShowReopenForm(true)}>
                <Text style={styles.reopenBtnText}>🔄 Request Reopen</Text>
              </Pressable>
            ) : (
              <View style={styles.reopenForm}>
                <Text style={styles.reopenFormLabel}>Reason for reopening</Text>
                <TextInput
                  style={styles.reopenTextAreaInput}
                  placeholder="Describe why the issue needs to be reopened..."
                  placeholderTextColor="#94A3B8"
                  value={reopenReason}
                  onChangeText={setReopenReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <View style={styles.reopenActions}>
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => { setShowReopenForm(false); setReopenReason(''); }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.submitReopenBtn, !reopenReason.trim() && styles.submitReopenBtnDisabled]}
                    onPress={() => void handleReopenRequest()}
                    disabled={!reopenReason.trim() || reopening}
                  >
                    {reopening ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitReopenBtnText}>Submit Request</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#0F172A' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  complaintId: { fontSize: 12, color: '#0F766E', fontWeight: '600', fontFamily: 'monospace', marginBottom: 6 },
  complaintTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', lineHeight: 24, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', gap: 8 },
  tag: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  timelineCircleDone: { backgroundColor: '#64748b', borderColor: '#64748b' },
  timelineCircleActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  timelineIcon: { fontSize: 11, color: '#94A3B8' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 2, minHeight: 20 },
  timelineLineDone: { backgroundColor: '#64748b' },
  timelineContent: { flex: 1, paddingBottom: 16, paddingTop: 4 },
  timelineLabel: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  timelineLabelActive: { color: '#0F766E', fontWeight: '700' },
  timelineDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  detailRow: { marginBottom: 12 },
  detailLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  detailValue: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
  // Resolved card
  resolvedCard: { borderColor: '#34d39940', backgroundColor: '#f0fdf9' },
  resolvedEmoji: { fontSize: 22, textAlign: 'center', marginBottom: 6 },
  resolvedTitle: { textAlign: 'center', fontWeight: '700', color: '#065f46', fontSize: 15, marginBottom: 4 },
  resolvedSubtitle: { textAlign: 'center', color: '#047857', fontSize: 13, marginBottom: 14 },
  feedbackBtn: {
    backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  feedbackBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  // Reopen
  reopenSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 12, lineHeight: 18 },
  reopenBtn: {
    backgroundColor: '#FEF3C7', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A',
  },
  reopenBtnText: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  reopenForm: { gap: 10 },
  reopenFormLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  reopenTextAreaInput: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#0F172A', minHeight: 80,
  },
  reopenActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, backgroundColor: '#F1F5F9', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  submitReopenBtn: {
    flex: 2, backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  submitReopenBtnDisabled: { backgroundColor: '#94A3B8' },
  submitReopenBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
