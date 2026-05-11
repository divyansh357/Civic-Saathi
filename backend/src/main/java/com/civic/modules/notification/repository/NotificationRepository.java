package com.civic.modules.notification.repository;

import com.civic.modules.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for Notification entity.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    Page<Notification> findByUserId(String userId, Pageable pageable);
    Page<Notification> findByUserIdAndRead(String userId, boolean read, Pageable pageable);
    long countByUserIdAndReadFalse(String userId);
}
