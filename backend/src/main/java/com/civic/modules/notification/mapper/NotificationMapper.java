package com.civic.modules.notification.mapper;

import com.civic.modules.notification.dto.NotificationResponse;
import com.civic.modules.notification.entity.Notification;
import org.springframework.stereotype.Component;

/**
 * Mapper for Notification entity and DTOs.
 */
@Component
public class NotificationMapper {
    public NotificationResponse toResponse(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId().toString());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setType(notification.getNotificationType() != null ? notification.getNotificationType().getName() : null);
        response.setRead(notification.getIsRead() != null ? notification.getIsRead() : false);
        response.setCreatedAt(notification.getCreatedAt());
        return response;
    }
}
