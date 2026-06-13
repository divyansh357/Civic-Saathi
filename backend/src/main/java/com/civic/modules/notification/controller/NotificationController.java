package com.civic.modules.notification.controller;

import com.civic.modules.notification.dto.NotificationResponse;
import com.civic.modules.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

/**
 * REST Controller for notification management endpoints.
 */
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * Get notifications for current user.
     */
    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            Principal principal,
            Pageable pageable) {
        String userId = principal.getName();
        Page<NotificationResponse> notifications = notificationService.getUserNotifications(userId, pageable);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notifications for current user.
     */
    @GetMapping("/unread")
    public ResponseEntity<Page<NotificationResponse>> getUnreadNotifications(
            Principal principal,
            Pageable pageable) {
        String userId = principal.getName();
        Page<NotificationResponse> notifications = notificationService.getUnreadNotifications(userId, pageable);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread count for current user.
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        String userId = principal.getName();
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(count);
    }

    /**
     * Mark notification as read.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable String id) {
        NotificationResponse response = notificationService.markAsRead(id);
        return ResponseEntity.ok(response);
    }
}
