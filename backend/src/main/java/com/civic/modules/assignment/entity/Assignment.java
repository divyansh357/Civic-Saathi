package com.civic.modules.assignment.entity;

import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.worker.entity.Worker;
import com.civic.modules.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Assignment entity representing the assignment of a complaint to a worker.
 * Updated to match the database schema with proper status tracking.
 */
@Entity
@Table(name = "assignments")
public class Assignment {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status = AssignmentStatus.ASSIGNED;

    @Column(name = "deadline_at")
    private LocalDateTime deadlineAt;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "is_auto_assigned", nullable = false)
    private Boolean isAutoAssigned = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "assignment_completion_images", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "image_url")
    private List<String> completionImages = new ArrayList<>();

    // Enum for assignment status
    public enum AssignmentStatus {
        ASSIGNED, ACCEPTED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED
    }

    // Constructors
    public Assignment() {
        this.assignedAt = LocalDateTime.now();
    }

    public Assignment(Complaint complaint, Worker worker, User assignedBy) {
        this();
        this.complaint = complaint;
        this.worker = worker;
        this.assignedBy = assignedBy;
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

    public Complaint getComplaint() {
        return complaint;
    }

    public void setComplaint(Complaint complaint) {
        this.complaint = complaint;
    }

    public String getComplaintId() {
        return complaint != null ? complaint.getId().toString() : null;
    }

    public Worker getWorker() {
        return worker;
    }

    public void setWorker(Worker worker) {
        this.worker = worker;
    }

    // Backward compatibility method
    @Deprecated
    public Worker getAssignedWorker() {
        return worker;
    }

    @Deprecated
    public void setAssignedWorker(Worker worker) {
        this.worker = worker;
    }

    public String getWorkerId() {
        return worker != null ? worker.getId() : null;
    }

    @Deprecated
    public String getAssignedWorkerId() {
        return getWorkerId();
    }

    public User getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(User assignedBy) {
        this.assignedBy = assignedBy;
    }

    public AssignmentStatus getStatus() {
        return status;
    }

    public void setStatus(AssignmentStatus status) {
        this.status = status;
    }

    // Backward compatibility method
    @Deprecated
    public String getStatusAsString() {
        return status != null ? status.name() : null;
    }

    @Deprecated
    public void setStatus(String status) {
        this.status = status != null ? AssignmentStatus.valueOf(status.toUpperCase()) : null;
    }

    public LocalDateTime getDeadlineAt() {
        return deadlineAt;
    }

    public void setDeadlineAt(LocalDateTime deadlineAt) {
        this.deadlineAt = deadlineAt;
    }

    // Backward compatibility method
    @Deprecated
    public LocalDateTime getSlaDeadline() {
        return deadlineAt;
    }

    @Deprecated
    public void setSlaDeadline(LocalDateTime slaDeadline) {
        this.deadlineAt = slaDeadline;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    // Backward compatibility method
    @Deprecated
    public LocalDateTime getCreatedAt() {
        return assignedAt;
    }

    @Deprecated
    public void setCreatedAt(LocalDateTime createdAt) {
        this.assignedAt = createdAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public LocalDateTime getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(LocalDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public Boolean getIsAutoAssigned() {
        return isAutoAssigned;
    }

    public void setIsAutoAssigned(Boolean autoAssigned) {
        isAutoAssigned = autoAssigned;
    }

    public List<String> getCompletionImages() {
        return completionImages;
    }

    public void setCompletionImages(List<String> completionImages) {
        this.completionImages = completionImages;
    }

    public void addCompletionImage(String imageUrl) {
        this.completionImages.add(imageUrl);
    }

    // Utility methods
    public void accept() {
        this.status = AssignmentStatus.ACCEPTED;
        this.acceptedAt = LocalDateTime.now();
    }

    public void reject(String reason) {
        this.status = AssignmentStatus.REJECTED;
        this.rejectedAt = LocalDateTime.now();
        this.rejectionReason = reason;
    }

    public void startProgress() {
        this.status = AssignmentStatus.IN_PROGRESS;
    }

    public void complete() {
        this.status = AssignmentStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = AssignmentStatus.CANCELLED;
    }

    public boolean isActive() {
        return status == AssignmentStatus.ASSIGNED || 
               status == AssignmentStatus.ACCEPTED || 
               status == AssignmentStatus.IN_PROGRESS;
    }
}
