package com.civic.modules.notification.workflow;

/**
 * Notification read status workflow states.
 */
public enum NotificationStatus {
    UNREAD("UNREAD"),   // Not yet read
    READ("READ");       // Read by user

    private final String value;

    NotificationStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static NotificationStatus fromValue(String value) {
        for (NotificationStatus status : NotificationStatus.values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid notification status: " + value);
    }
}
