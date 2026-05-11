package com.civic.modules.feedback.entity;

import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ReopenRequest entity for handling requests to reopen closed complaints.
 */
@Entity
@Table(name = "reopen_requests")
public class ReopenRequest {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "reopen_count")
    private Integer reopenCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReopenStatus status = ReopenStatus.REQUESTED;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Enum for reopen request status
    public enum ReopenStatus {
        REQUESTED, APPROVED, REJECTED
    }

    // Constructors
    public ReopenRequest() {
        this.createdAt = LocalDateTime.now();
    }

    public ReopenRequest(Complaint complaint, User user, String reason) {
        this();
        this.complaint = complaint;
        this.user = user;
        this.reason = reason;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Complaint getComplaint() {
        return complaint;
    }

    public void setComplaint(Complaint complaint) {
        this.complaint = complaint;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Integer getReopenCount() {
        return reopenCount;
    }

    public void setReopenCount(Integer reopenCount) {
        this.reopenCount = reopenCount;
    }

    public ReopenStatus getStatus() {
        return status;
    }

    public void setStatus(ReopenStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Utility methods
    public void approve() {
        this.status = ReopenStatus.APPROVED;
    }

    public void reject() {
        this.status = ReopenStatus.REJECTED;
    }

    public boolean canReopen() {
        return reopenCount == null || reopenCount < 6;
    }
}