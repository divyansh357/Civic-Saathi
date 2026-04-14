package com.civic.modules.notification.service;

import com.civic.modules.notification.dto.NotificationResponse;
import com.civic.modules.notification.entity.Notification;
import com.civic.modules.notification.mapper.NotificationMapper;
import com.civic.modules.notification.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for notification management.
 */
@Service
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationMapper notificationMapper;

    /**
     * Get notifications for a user.
     */
    public Page<NotificationResponse> getUserNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable)
                .map(notificationMapper::toResponse);
    }

    /**
     * Get unread notifications for a user.
     */
    public Page<NotificationResponse> getUnreadNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByUserIdAndRead(userId, false, pageable)
                .map(notificationMapper::toResponse);
    }

    /**
     * Send notification to user.
     */
    public NotificationResponse sendNotification(Notification notification) {
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        Notification savedNotification = notificationRepository.save(notification);
        return notificationMapper.toResponse(savedNotification);
    }

    /**
     * Mark notification as read.
     */
    public NotificationResponse markAsRead(String notificationId) {
        Optional<Notification> notificationOptional = notificationRepository.findById(notificationId);
        if (notificationOptional.isPresent()) {
            Notification notification = notificationOptional.get();
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            Notification updated = notificationRepository.save(notification);
            return notificationMapper.toResponse(updated);
        }
        throw new RuntimeException("Notification not found with ID: " + notificationId);
    }

    /**
     * Get unread count for user.
     */
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }
}
