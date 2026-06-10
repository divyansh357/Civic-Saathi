import { useEffect, useState } from 'react';
import {
  View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { useAuthStore, useComplaintStore } from '@store/index';
import { apiGet } from '@services/api/client';
import { Complaint } from '@/types';
import { Text, Surface, Card, Avatar, IconButton, useTheme, TouchableRipple } from 'react-native-paper';

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
  const theme = useTheme();
  const color = STATUS_COLORS[complaint.status] ?? theme.colors.outline;
  return (
    <Card style={styles.card} onPress={onPress} mode="elevated" elevation={1}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text variant="labelSmall" style={[styles.cardId, { color: theme.colors.primary }]}>{complaint.id}</Text>
          <Surface style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
            <Text variant="labelSmall" style={[styles.statusText, { color }]}>
              {STATUS_LABELS[complaint.status] ?? complaint.status}
            </Text>
          </Surface>
        </View>
        <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={2}>{complaint.title}</Text>
        <View style={styles.cardMeta}>
          {complaint.category && (
            <Surface style={[styles.categoryTag, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{complaint.category}</Text>
            </Surface>
          )}
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>{formatDate(complaint.createdAt)}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

interface HomeScreenProps {
  onNewComplaint: () => void;
  onComplaintDetail: (complaint: Complaint) => void;
  onNavigateToNotifications: () => void;
  onNavigateToProfile: () => void;
}

export default function HomeScreen({ onNewComplaint, onComplaintDetail, onNavigateToNotifications, onNavigateToProfile }: HomeScreenProps) {
  const theme = useTheme();
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
    // To ensure they look like different ones, let's just pick the latest ones.
    // If complaints are empty, we still simulate finding some generic ones or empty.
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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <TouchableRipple onPress={onNavigateToProfile} style={{ borderRadius: 20 }}>
          <Avatar.Text
            size={40}
            label={(user?.name ?? 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          />
        </TouchableRipple>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Hello, {user?.name?.split(' ')[0] ?? 'Citizen'} 👋</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Report civic issues in your area</Text>
        </View>
        <Surface elevation={1} style={styles.notificationBtnWrap}>
          <IconButton
            icon="bell-outline"
            size={20}
            onPress={onNavigateToNotifications}
          />
        </Surface>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total, color: '#60a5fa' },
          { label: 'Active', value: stats.open, color: '#fbbf24' },
          { label: 'Resolved', value: stats.resolved, color: '#34d399' },
        ].map((s) => (
          <Surface key={s.label} style={styles.statCard} elevation={1}>
            <Text variant="headlineSmall" style={{ color: s.color, fontWeight: 'bold' }}>{s.value}</Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>{s.label}</Text>
          </Surface>
        ))}
      </View>

      {/* New Complaint CTA */}
      <Surface style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]} elevation={2}>
        <TouchableRipple
          onPress={onNewComplaint}
          style={styles.ctaRipple}
          borderless
        >
          <>
            <View style={styles.ctaIconWrap}>
              <Text style={styles.ctaIcon}>+</Text>
            </View>
            <View>
              <Text variant="titleMedium" style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>Report a New Issue</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimary, opacity: 0.8 }}>Tap to submit a civic complaint</Text>
            </View>
          </>
        </TouchableRipple>
      </Surface>

      {/* Complaints List */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>My Complaints</Text>
        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
        ) : complaints.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>No complaints yet</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Tap the button above to report your first issue
            </Text>
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
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>Complaints Near Me</Text>
        {loadingLocation ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
        ) : locationError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>Location Required</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {locationError}
            </Text>
          </View>
        ) : nearbyComplaints.length === 0 ? (
           <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>All Clear!</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              No complaints near your location.
            </Text>
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
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  greeting: { marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  notificationBtnWrap: {
    borderRadius: 24,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  ctaButton: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  ctaRipple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIcon: { fontSize: 28, color: '#FFFFFF', fontWeight: '300', lineHeight: 32 },
  section: { gap: 10 },
  card: {
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardId: { fontWeight: '600', fontFamily: 'monospace', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontWeight: '600', lineHeight: 20, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
});
