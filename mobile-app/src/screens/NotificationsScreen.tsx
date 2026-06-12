import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { formatNotificationTime } from '@services/notifications';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/index';
import { apiGetWithHeaders, apiPutWithHeaders } from '@services/api/client';

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  complaint_status: <Ionicons name="clipboard-outline" size={24} color="#64748b" />,
  assignment: <Ionicons name="git-network-outline" size={24} color="#64748b" />,
  escalation: <Ionicons name="alert-circle-outline" size={24} color="#64748b" />,
  system: <Ionicons name="notifications-outline" size={24} color="#64748b" />,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  complaint_status: '#60a5fa',
  assignment: '#fbbf24',
  escalation: '#f87171',
  system: '#a78bfa',
};

interface NotificationCardProps {
  notification: any;
  onPress: () => void;
}

function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const typeKey = notification.type?.toLowerCase() || 'system';
  const icon = NOTIFICATION_ICONS[typeKey] || <Ionicons name="notifications-outline" size={24} color="#64748b" />;
  const color = NOTIFICATION_COLORS[typeKey] || '#64748b';

  return (
    <Pressable style={[styles.card, notification.read ? { opacity: 0.7 } : {}]} onPress={onPress} android_ripple={{ color: '#e2e8f0' }}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={[styles.title, !notification.read && { fontWeight: '700' }]} numberOfLines={1}>{notification.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{notification.message}</Text>
        <Text style={styles.time}>{formatNotificationTime(notification.createdAt)}</Text>
      </View>
      {!notification.read && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0F766E', alignSelf: 'center', marginLeft: 8 }} />
      )}
    </Pressable>
  );
}

interface NotificationsScreenProps {
  onBack: () => void;
}

export default function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async (isRefresh = false) => {
    if (!accessToken || !user) return;
    if (!isRefresh) setLoading(true);
    try {
      const res: any = await apiGetWithHeaders('/notifications', accessToken, { 'User-Id': user.id });
      const list = res.data ?? res.content ?? (Array.isArray(res) ? res : []);
      setNotifications(list);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, [accessToken, user]);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchNotifications(true);
  };

  const handleNotificationPress = async (notification: any) => {
    // Mark as read in UI optimistically
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    
    // Update backend
    if (!notification.read && user) {
      try {
        await apiPutWithHeaders(`/notifications/${notification.id}/read`, {}, accessToken || undefined, { 'User-Id': user.id });
      } catch (e) {
        console.error('Failed to mark read', e);
      }
    }
    
    // Handle navigation based on notification type
    const type = notification.type?.toUpperCase() || 'SYSTEM';
    if (type === 'NEW_COMPLAINT' || type === 'ASSIGNMENT') {
      // e.g. navigate to complaint
    }
  };

  const handleClearAll = () => {
    // backend doesn't have clear all endpoint yet
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <Pressable style={styles.clearBtn} onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F766E" />}
      >
        {loading ? (
          <ActivityIndicator color="#0F766E" style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}><Ionicons name="notifications-outline" size={20} color="#64748b" /></Text>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You&apos;ll receive updates about your complaints and assignments here
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Recent ({notifications.length})
            </Text>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={() => handleNotificationPress(notification)}
              />
            ))}
          </>
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
  clearBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  clearText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardLeft: { marginRight: 12 },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  cardContent: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  body: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 6 },
  time: { fontSize: 11, color: '#94A3B8' },
  
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#334155', marginBottom: 8 },
  emptySubtitle: { 
    fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20,
    paddingHorizontal: 20,
  },
});
