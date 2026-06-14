package com.civic.modules.complaint.service;

import com.civic.modules.complaint.dto.CreateComplaintRequest;
import com.civic.modules.complaint.dto.ComplaintResponse;
import com.civic.modules.complaint.dto.UpdateComplaintStatusRequest;
import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.complaint.mapper.ComplaintMapper;
import com.civic.modules.complaint.repository.ComplaintRepository;
import com.civic.modules.complaint.workflow.ComplaintWorkflow;
import com.civic.modules.worker.entity.Worker;
import com.civic.modules.worker.repository.WorkerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service layer for complaint management.
 */
@Service
@Transactional
public class ComplaintService {

    private static final Logger logger = LoggerFactory.getLogger(ComplaintService.class);

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private ComplaintMapper complaintMapper;

    @Autowired
    private ComplaintWorkflow complaintWorkflow;

    @Autowired
    private AiVerificationService aiVerificationService;

    @Autowired
    private com.civic.modules.assignment.service.AssignmentService assignmentService;

    @Autowired
    private com.civic.modules.notification.service.NotificationService notificationService;

    /**
     * Get all complaints with optional status/search filters.
     */
    @Transactional(readOnly = true)
    public Page<ComplaintResponse> getAllComplaints(String status, String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return complaintRepository.searchComplaints(search.trim(), pageable)
                .map(complaintMapper::toResponse);
        }
        if (status != null && !status.isBlank()) {
            return complaintRepository.findByStatus(status, pageable)
                .map(complaintMapper::toResponse);
        }
        return complaintRepository.findAll(pageable).map(complaintMapper::toResponse);
    }

    /**
     * Search complaints by keyword.
     */
    @Transactional(readOnly = true)
    public Page<ComplaintResponse> searchComplaints(String query, Pageable pageable) {
        return complaintRepository.searchComplaints(query, pageable).map(complaintMapper::toResponse);
    }

    /** Create a new complaint. */
    public ComplaintResponse createComplaint(CreateComplaintRequest request, String userId) {
        Complaint complaint = complaintMapper.toEntity(request, userId);
        // Set SLA deadline based on priority (hours): 1=CRITICAL, 2=HIGH, 3=MEDIUM, 4=LOW
        int priorityVal = request.getPriority() != null ? request.getPriority() : 3;
        int slaHours = switch (priorityVal) {
            case 1  -> 4;   // CRITICAL
            case 2  -> 24;  // HIGH
            case 4  -> 168; // LOW (7 days)
            default -> 48;  // MEDIUM
        };
        complaint.setSlaDeadline(LocalDateTime.now().plusHours(slaHours));

        // Call AI Layer for Auto-Verification
        AiVerificationService.AiVerificationResult aiResult = aiVerificationService.verifyComplaint(
            request.getTitle(), request.getDescription(), request.getCategory(), request.getImageUrls()
        );

        complaint.setAiSummary(aiResult.summary);
        complaint.setAiPriorityScore(aiResult.confidenceScore);

        if (aiResult.isValid && aiResult.confidenceScore >= 0.7f) {
            complaint.setStatus(Complaint.ComplaintStatus.VERIFIED);
            complaint.setVerificationMethod("AI");
            logger.info("Complaint auto-verified by AI. Confidence: {}. Awaiting admin assignment.", aiResult.confidenceScore);
            
            // Save the complaint and wait for manual assignment or admin-triggered auto-assignment
            complaint = complaintRepository.save(complaint);
        } else {
            // Flagged for manual review
            complaint.setStatus(Complaint.ComplaintStatus.SUBMITTED);
            complaint.setVerificationMethod("PENDING");
            // If explicitly marked invalid, we can use a special status or just log it
            if (!aiResult.isValid) {
                logger.warn("Complaint flagged as INVALID by AI. Confidence: {}", aiResult.confidenceScore);
                complaint.setStatus(Complaint.ComplaintStatus.AI_REJECTED);
            } else {
                logger.info("Complaint requires manual verification. AI Confidence: {}", aiResult.confidenceScore);
            }
            complaint = complaintRepository.save(complaint);
        }

        // Send Notification
        com.civic.modules.notification.entity.Notification notif = new com.civic.modules.notification.entity.Notification();
        notif.setUser(complaint.getUser());
        notif.setTitle("Complaint Submitted");
        notif.setMessage("Your complaint '" + complaint.getTitle() + "' has been successfully submitted.");
        notif.setType("NEW_COMPLAINT");
        notif.setReferenceId(complaint.getId().toString());
        notificationService.sendNotification(notif);

        return complaintMapper.toResponse(complaint);
    }

    /** Get complaint by ID. */
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(String id) {
        return complaintRepository.findById(UUID.fromString(id))
            .map(complaintMapper::toResponse)
            .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
    }

    /** Get all complaints for a user. */
    @Transactional(readOnly = true)
    public Page<ComplaintResponse> getComplaintsByUserId(String userId, Pageable pageable) {
        return complaintRepository.findByUserId(java.util.UUID.fromString(userId), pageable).map(complaintMapper::toResponse);
    }

    /** Get all complaints for a department. */
    @Transactional(readOnly = true)
    public Page<ComplaintResponse> getComplaintsByDepartmentId(String departmentId, Pageable pageable) {
        return complaintRepository.findByDepartmentId(java.util.UUID.fromString(departmentId), pageable).map(complaintMapper::toResponse);
    }

    /** Get all complaints with a specific status. */
    @Transactional(readOnly = true)
    public Page<ComplaintResponse> getComplaintsByStatus(String status, Pageable pageable) {
        return complaintRepository.findByStatus(status, pageable).map(complaintMapper::toResponse);
    }

    /** Update complaint status with workflow validation. */
    public ComplaintResponse updateComplaintStatus(String id, UpdateComplaintStatusRequest request) {
        Complaint complaint = complaintRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));

        complaintWorkflow.applyTransition(complaint, request.getStatus());

        // Track timestamps for key transitions
        Complaint.ComplaintStatus newStatus = complaint.getStatus();
        if (newStatus == Complaint.ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
        } else if (newStatus == Complaint.ComplaintStatus.CLOSED) {
            complaint.setClosedAt(LocalDateTime.now());
        } else if (newStatus == Complaint.ComplaintStatus.ESCALATED) {
            complaint.setEscalatedAt(LocalDateTime.now());
        }

        if (request.getAssignedWorkerId() != null) {
            Worker worker = workerRepository.findById(UUID.fromString(request.getAssignedWorkerId()))
                .orElseThrow(() -> new RuntimeException("Worker not found: " + request.getAssignedWorkerId()));
            complaint.setAssignedWorker(worker);
        }

        return complaintMapper.toResponse(complaintRepository.save(complaint));
    }

    /** Escalate a complaint (SLA breach or manual). */
    public ComplaintResponse escalateComplaint(String id, String reason) {
        Complaint complaint = complaintRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));

        if (!complaintWorkflow.canEscalate(complaint.getStatus())) {
            throw new IllegalStateException("Complaint cannot be escalated from status: " + complaint.getStatus());
        }

        complaintWorkflow.applyTransition(complaint, "ESCALATED");
        complaint.setEscalatedAt(LocalDateTime.now());
        logger.info("Complaint {} escalated. Reason: {}", id, reason);
        return complaintMapper.toResponse(complaintRepository.save(complaint));
    }

    /** Auto-escalate all SLA-breached complaints. */
    public int autoEscalateSlaBreached() {
        List<Complaint> breached = complaintRepository.findSlaBreachedComplaints(LocalDateTime.now());
        int count = 0;
        for (Complaint c : breached) {
            if (complaintWorkflow.canEscalate(c.getStatus())) {
                c.setStatus(Complaint.ComplaintStatus.ESCALATED);
                c.setEscalatedAt(LocalDateTime.now());
                c.setUpdatedAt(LocalDateTime.now());
                complaintRepository.save(c);
                count++;
            }
        }
        logger.info("Auto-escalated {} SLA-breached complaints", count);
        return count;
    }

    /** Submit feedback for a complaint (delegates to FeedbackService — kept for backward compat). */
    public ComplaintResponse submitFeedback(String id, Integer rating, String feedback) {
        Complaint complaint = complaintRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
        complaint.setUpdatedAt(LocalDateTime.now());
        logger.info("Feedback for complaint {}: rating={}", id, rating);
        return complaintMapper.toResponse(complaintRepository.save(complaint));
    }

    /** Delete a complaint. */
    public void deleteComplaint(String id) {
        UUID uuid = UUID.fromString(id);
        if (!complaintRepository.existsById(uuid)) {
            throw new RuntimeException("Complaint not found: " + id);
        }
        complaintRepository.deleteById(uuid);
    }

    /** Get complaint statistics. */
    @Transactional(readOnly = true)
    public ComplaintStatistics getStatistics() {
        long open = complaintRepository.countByStatus("SUBMITTED")
                  + complaintRepository.countByStatus("VERIFIED")
                  + complaintRepository.countByStatus("ASSIGNED");
        long inProgress = complaintRepository.countByStatus("IN_PROGRESS");
        long resolved = complaintRepository.countByStatus("RESOLVED");
        long closed = complaintRepository.countByStatus("CLOSED");
        long escalated = complaintRepository.countByStatus("ESCALATED");
        long total = complaintRepository.count();
        return new ComplaintStatistics(open, inProgress, resolved, closed, escalated, total);
    }

    public static class ComplaintStatistics {
        public long openCount;
        public long inProgressCount;
        public long resolvedCount;
        public long closedCount;
        public long escalatedCount;
        public long totalCount;

        public ComplaintStatistics(long open, long inProgress, long resolved, long closed, long escalated, long total) {
            this.openCount = open;
            this.inProgressCount = inProgress;
            this.resolvedCount = resolved;
            this.closedCount = closed;
            this.escalatedCount = escalated;
            this.totalCount = total;
        }
    }
}
