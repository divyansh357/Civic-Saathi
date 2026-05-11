import { Alert } from 'react-native';

// Notification types based on Level A features
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'complaint_status' | 'assignment' | 'escalation' | 'system';
  data?: {
    complaintId?: string;
    assignmentId?: string;
    status?: string;
  };
  timestamp: string;
}

class NotificationService {
  private notifications: NotificationData[] = [];
  private listeners: ((notifications: NotificationData[]) => void)[] = [];

  // Initialize notification service
  async initialize(): Promise<boolean> {
    try {
      // In a real app, this would initialize Firebase FCM or Expo Notifications
      console.log('Notification service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      // In a real app, this would request actual notification permissions
      // For now, we'll simulate permission granted
      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  // Add a notification (simulated for Level A implementation)
  addNotification(notification: Omit<NotificationData, 'id' | 'timestamp'>) {
    const newNotification: NotificationData = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(this.notifications));

    // Show alert for immediate notification (Level A implementation)
    Alert.alert(
      notification.title,
      notification.body,
      [{ text: 'OK' }]
    );
  }

  // Get all notifications
  getNotifications(): NotificationData[] {
    return [...this.notifications];
  }

  // Subscribe to notification updates
  subscribe(listener: (notifications: NotificationData[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    // In a real app, this would update the backend
    console.log(`Marked notification ${notificationId} as read`);
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Simulate complaint status update notification
  notifyComplaintStatusUpdate(complaintId: string, status: string, title: string) {
    this.addNotification({
      title: 'Complaint Status Updated',
      body: `Your complaint "${title}" is now ${status.toLowerCase()}`,
      type: 'complaint_status',
      data: { complaintId, status }
    });
  }

  // Simulate assignment notification for workers
  notifyNewAssignment(assignmentId: string, complaintTitle: string) {
    this.addNotification({
      title: 'New Assignment',
      body: `You have been assigned: ${complaintTitle}`,
      type: 'assignment',
      data: { assignmentId }
    });
  }

  // Simulate escalation notification
  notifyEscalation(complaintId: string, title: string) {
    this.addNotification({
      title: 'Complaint Escalated',
      body: `Complaint "${title}" has been escalated due to SLA breach`,
      type: 'escalation',
      data: { complaintId }
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Helper function to format notification time
export function formatNotificationTime(timestamp: string): string {
  const now = new Date();
  const notifTime = new Date(timestamp);
  const diffMs = now.getTime() - notifTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return notifTime.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short' 
  });
}