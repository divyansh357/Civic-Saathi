import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { useAuthStore, useComplaintStore } from '@store/index';
import { apiGet } from '@services/api/client';
import { Complaint } from '@/types';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#60a5fa',
  VERIFIED: '#a78bfa',
  ASSIGNED: '#fbbf24',
  IN_PROGRESS: '#fb923c',
  RESOLVED: '#34d399',
  CLOSED: '#64748b',
  ESCALATED: '#f87171',
  REOPENED: '#fbbf24',
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  VERIFIED: 'Verified',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  ESCALATED: 'Escalated',
  REOPENED: 'Reopened',
};

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ComplaintCardProps {
  complaint: Complaint;
  onPress: () => void;
}

function ComplaintCard({ complaint, onPress }: ComplaintCardProps) {
  const color = STATUS_COLORS[complaint.status] ?? '#64748b';
  return (
    <Pressable style={styles.card} onPress={onPress} android_ripple={{ color: '#e2e8f0' }}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={styles.cardId}>{complaint.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.statusText, { color }]}>
            {STATUS_LABELS[complaint.status] ?? complaint.status}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{complaint.title}</Text>
      <View style={styles.cardMeta}>
        {complaint.category && (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{complaint.category}</Text>
          </View>
        )}
        <Text style={styles.dateText}>{formatDate(complaint.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

interface HomeScreenProps {
  onNewComplaint: () => void;
  onComplaintDetail: (complaint: Complaint) => void;
  onNavigateToNotifications: () => void;
  onNavigateToProfile: () => void;
}

export default function HomeScreen({ onNewComplaint, onComplaintDetail, onNavigateToNotifications, onNavigateToProfile }: HomeScreenProps) {
  const user = useAuthStore((s) => s.user);
  const { complaints, setComplaints, isLoading, setLoading } = useComplaintStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearbyComplaints, setNearbyComplaints] = useState<Complaint[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchComplaints = async (silent = false) => {
    if (!accessToken) return;
    if (!silent) setLoading(true);
    try {
      const res = await apiGet<{ data: Complaint[] }>(
        '/complaints?page=0&size=20&sortBy=createdAt&sortDir=DESC',
        accessToken
      );
      setComplaints(res.data ?? []);
    } catch {
      // keep existing data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void fetchComplaints(); }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 1: Request location permission & get coordinates (runs once on mount)
  useEffect(() => {
    (async () => {
      setLoadingLocation(true);
      setLocationError(null);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied. Enable it in Settings to see nearby complaints.');
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setUserCoords({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch {
        setLocationError('Unable to fetch your location. Please try again.');
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []); // runs once on mount

  // Effect 2: Populate nearby complaints when we have BOTH coordinates AND complaints
  useEffect(() => {
    if (!userCoords) return; // location not ready yet

    // TODO: Replace this simulation with a real API call when available:
    // e.g. const res = await apiGet(`/complaints/nearby?lat=${userCoords.latitude}&lng=${userCoords.longitude}`, accessToken);
    // setNearbyComplaints(res.data ?? []);

    // Simulation: show up to 5 recent complaints as "nearby"
    if (complaints.length > 0) {
      setNearbyComplaints(complaints.slice(0, Math.min(5, complaints.length)));
    } else {
      setNearbyComplaints([]);
    }
  }, [userCoords, complaints]);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchComplaints(true);
  };

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => !['RESOLVED', 'CLOSED'].includes(c.status)).length,
    resolved: complaints.filter((c) => c.status === 'RESOLVED').length,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F766E" />}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Pressable style={styles.avatarBtn} onPress={onNavigateToProfile}>
          <Text style={styles.avatarText}>
            {(user?.name ?? 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingText}>Hello, {user?.name?.split(' ')[0] ?? 'Citizen'} 👋</Text>
          <Text style={styles.greetingSubtext}>Report civic issues in your area</Text>
        </View>
        <Pressable style={styles.notificationBtn} onPress={onNavigateToNotifications}>
          <Text style={styles.notificationIcon}><Ionicons name="notifications-outline" size={20} color="#64748b" /></Text>
        </Pressable>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total, color: '#60a5fa' },
          { label: 'Active', value: stats.open, color: '#fbbf24' },
          { label: 'Resolved', value: stats.resolved, color: '#34d399' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* New Complaint CTA */}
      <Pressable style={styles.ctaButton} onPress={onNewComplaint}>
        <Text style={styles.ctaIcon}>+</Text>
        <View>
          <Text style={styles.ctaTitle}>Report a New Issue</Text>
          <Text style={styles.ctaSubtitle}>Tap to submit a civic complaint</Text>
        </View>
      </Pressable>

      {/* Complaints List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Complaints</Text>
        {isLoading ? (
          <ActivityIndicator color="#0F766E" style={{ marginTop: 24 }} />
        ) : complaints.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}><Ionicons name="clipboard-outline" size={20} color="#64748b" /></Text>
            <Text style={styles.emptyTitle}>No complaints yet</Text>
            <Text style={styles.emptySubtitle}>Tap the button above to report your first issue</Text>
          </View>
        ) : (
          complaints.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              onPress={() => onComplaintDetail(c)}
            />
          ))
        )}
      </View>

      {/* Complaints Near Me */}
      <View style={[styles.section, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Complaints Near Me</Text>
        {loadingLocation ? (
          <ActivityIndicator color="#0F766E" style={{ marginTop: 24 }} />
        ) : locationError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}><Ionicons name="location-outline" size={20} color="#64748b" /></Text>
            <Text style={styles.emptyTitle}>Location Required</Text>
            <Text style={styles.emptySubtitle}>{locationError}</Text>
          </View>
        ) : nearbyComplaints.length === 0 ? (
           <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>No complaints near your location.</Text>
          </View>
        ) : (
          nearbyComplaints.map((c) => (
            <ComplaintCard
              key={`nearby-${c.id}`}
              complaint={c}
              onPress={() => onComplaintDetail(c)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  content: { padding: 16, paddingBottom: 32 },
  greeting: { marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#0F766E',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  greetingText: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  greetingSubtext: { fontSize: 13, color: '#64748B', marginTop: 1 },
  notificationBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  notificationIcon: { fontSize: 18 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '500' },
  ctaButton: {
    backgroundColor: '#0F766E', borderRadius: 14, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24,
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  ctaIcon: { fontSize: 28, color: '#FFFFFF', fontWeight: '300', lineHeight: 32 },
  ctaTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  ctaSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardId: { fontSize: 12, color: '#0F766E', fontWeight: '600', fontFamily: 'monospace', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B', lineHeight: 20, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  dateText: { fontSize: 11, color: '#94A3B8' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});
