package com.civic.modules.notification.workflow;

import com.civic.modules.notification.entity.Notification;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Notification read status workflow state machine.
 * Manages notification read/unread transitions.
 */
@Component
public class NotificationWorkflow {

    /**
     * Check if a transition from currentStatus to newStatus is valid.
     */
    public boolean isValidTransition(boolean currentRead, String newStatus) {
        NotificationStatus current = currentRead ? NotificationStatus.READ : NotificationStatus.UNREAD;
        try {
            NotificationStatus next = NotificationStatus.fromValue(newStatus);
            // Only UNREAD → READ is valid
            return current == NotificationStatus.UNREAD && next == NotificationStatus.READ;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Apply status transition to notification.
     * Marks notification as read.
     */
    public void markAsRead(Notification notification) {
        if (notification.isRead()) {
            throw new IllegalStateException("Notification is already read");
        }
        
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
    }

    /**
     * Check if notification is unread.
     */
    public boolean isUnread(Notification notification) {
        return !notification.isRead();
    }

    /**
     * Get workflow description.
     */
    public String getWorkflowDescription() {
        return "UNREAD → READ (terminal state)";
    }
}
