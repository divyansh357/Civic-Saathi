package com.civic.modules.notification.entity;

import com.civic.modules.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Notification entity for push and in-app notifications.
 * Updated to match database schema with proper relationships.
 */
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_type_id", nullable = false)
    private NotificationType notificationType;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "related_entity_id")
    private UUID relatedEntityId;

    @Column(name = "related_entity_type")
    private String relatedEntityType;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationChannel channel = NotificationChannel.IN_APP;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status = NotificationStatus.PENDING;

    // Enums
    public enum NotificationChannel {
        IN_APP, PUSH, EMAIL, SMS
    }

    public enum NotificationStatus {
        PENDING, SENT, DELIVERED, FAILED, READ
    }

    // Constructors
    public Notification() {
        this.createdAt = LocalDateTime.now();
    }

    public Notification(User user, NotificationType notificationType, String title, String message) {
        this();
        this.user = user;
        this.notificationType = notificationType;
        this.title = title;
        this.message = message;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    // Backward compatibility method
    @Deprecated
    public String getIdAsString() {
        return id != null ? id.toString() : null;
    }

    @Deprecated
    public void setId(String id) {
        this.id = id != null ? UUID.fromString(id) : null;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    // Backward compatibility method
    @Deprecated
    public String getUserId() {
        return user != null ? user.getId() : null;
    }

    @Deprecated
    public void setUserId(String userId) {
        // This would need user lookup to work properly
    }

    public NotificationType getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(NotificationType notificationType) {
        this.notificationType = notificationType;
    }

    // Backward compatibility method
    @Deprecated
    public String getType() {
        return notificationType != null ? notificationType.getName() : null;
    }

    @Deprecated
    public void setType(String type) {
        // This would need NotificationType lookup to work properly
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public UUID getRelatedEntityId() {
        return relatedEntityId;
    }

    public void setRelatedEntityId(UUID relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }

    // Backward compatibility method
    @Deprecated
    public String getRelatedEntityIdAsString() {
        return relatedEntityId != null ? relatedEntityId.toString() : null;
    }

    @Deprecated
    public void setRelatedEntityId(String relatedEntityId) {
        this.relatedEntityId = relatedEntityId != null ? UUID.fromString(relatedEntityId) : null;
    }

    public String getRelatedEntityType() {
        return relatedEntityType;
    }

    public void setRelatedEntityType(String relatedEntityType) {
        this.relatedEntityType = relatedEntityType;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    // Backward compatibility method
    @Deprecated
    public boolean isRead() {
        return isRead != null ? isRead : false;
    }

    @Deprecated
    public void setRead(boolean read) {
        this.isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public void setChannel(NotificationChannel channel) {
        this.channel = channel;
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationStatus status) {
        this.status = status;
    }

    // Utility methods
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
        this.status = NotificationStatus.READ;
    }

    public void markAsSent() {
        this.sentAt = LocalDateTime.now();
        this.status = NotificationStatus.SENT;
    }
}
