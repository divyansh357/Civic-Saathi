import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { notificationService, NotificationData, formatNotificationTime } from '@services/notifications';

const NOTIFICATION_ICONS: Record<string, string> = {
  complaint_status: '📋',
  assignment: '🔧',
  escalation: '🚨',
  system: '⚙️',
};

const NOTIFICATION_COLORS: Record<string, string> = {
  complaint_status: '#60a5fa',
  assignment: '#fbbf24',
  escalation: '#f87171',
  system: '#a78bfa',
};

interface NotificationCardProps {
  notification: NotificationData;
  onPress: () => void;
}

function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const icon = NOTIFICATION_ICONS[notification.type] || '📢';
  const color = NOTIFICATION_COLORS[notification.type] || '#64748b';

  return (
    <Pressable style={styles.card} onPress={onPress} android_ripple={{ color: '#e2e8f0' }}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
        <Text style={styles.time}>{formatNotificationTime(notification.timestamp)}</Text>
      </View>
    </Pressable>
  );
}

interface NotificationsScreenProps {
  onBack: () => void;
}

export default function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initialize notifications and subscribe to updates
    setLoading(true);
    
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setLoading(false);
      setRefreshing(false);
    });

    // Get initial notifications
    setNotifications(notificationService.getNotifications());
    setLoading(false);

    return unsubscribe;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // In a real app, this would fetch notifications from the server
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNotificationPress = (notification: NotificationData) => {
    // Mark as read
    notificationService.markAsRead(notification.id);
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'complaint_status':
        // Navigate to complaint detail
        // eslint-disable-next-line no-console
        console.log('Navigate to complaint:', notification.data?.complaintId);
        break;
      case 'assignment':
        // Navigate to assignment detail
        // eslint-disable-next-line no-console
        console.log('Navigate to assignment:', notification.data?.assignmentId);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log('Notification pressed:', notification.id);
    }
  };

  const handleClearAll = () => {
    notificationService.clearAll();
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
            <Text style={styles.emptyIcon}>🔔</Text>
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