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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service layer for complaint management.
 * Handles business logic and data persistence.
 */
@Service
@Transactional
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private ComplaintMapper complaintMapper;

    @Autowired
    private ComplaintWorkflow complaintWorkflow;

    /**
     * Create a new complaint.
     */
    public ComplaintResponse createComplaint(CreateComplaintRequest request, String userId) {
        Complaint complaint = complaintMapper.toEntity(request, userId);
        Complaint savedComplaint = complaintRepository.save(complaint);
        return complaintMapper.toResponse(savedComplaint);
    }

    /**
     * Get complaint by ID.
     */
    public ComplaintResponse getComplaintById(String id) {
        Optional<Complaint> complaint = complaintRepository.findById(id);
        if (complaint.isPresent()) {
            return complaintMapper.toResponse(complaint.get());
        }
        throw new RuntimeException("Complaint not found with ID: " + id);
    }

    /**
     * Get all complaints for a user.
     */
    public Page<ComplaintResponse> getComplaintsByUserId(String userId, Pageable pageable) {
        return complaintRepository.findByUserId(userId, pageable)
                .map(complaintMapper::toResponse);
    }

    /**
     * Get all complaints for a department.
     */
    public Page<ComplaintResponse> getComplaintsByDepartmentId(String departmentId, Pageable pageable) {
        return complaintRepository.findByDepartmentId(departmentId, pageable)
                .map(complaintMapper::toResponse);
    }

    /**
     * Get all complaints with a specific status.
     */
    public Page<ComplaintResponse> getComplaintsByStatus(String status, Pageable pageable) {
        return complaintRepository.findByStatus(status, pageable)
                .map(complaintMapper::toResponse);
    }

    /**
     * Update complaint status with workflow validation.
     */
    public ComplaintResponse updateComplaintStatus(String id, UpdateComplaintStatusRequest request) {
        Optional<Complaint> complaintOptional = complaintRepository.findById(id);
        if (complaintOptional.isEmpty()) {
            throw new RuntimeException("Complaint not found with ID: " + id);
        }

        Complaint complaint = complaintOptional.get();

        // Apply workflow transition
        complaintWorkflow.applyTransition(complaint, request.getStatus());

        // Update additional fields if provided
        if (request.getResolution() != null) {
            complaint.setResolution(request.getResolution());
        }

        if (request.getAssignedWorkerId() != null) {
            Worker worker = workerRepository.findById(request.getAssignedWorkerId())
                    .orElseThrow(() -> new RuntimeException("Worker not found with ID: " + request.getAssignedWorkerId()));
            complaint.setAssignedWorker(worker);
        }

        Complaint updatedComplaint = complaintRepository.save(complaint);
        return complaintMapper.toResponse(updatedComplaint);
    }

    /**
     * Add feedback and rating to resolved complaint.
     */
    public ComplaintResponse submitFeedback(String id, Integer rating, String feedback) {
        Optional<Complaint> complaintOptional = complaintRepository.findById(id);
        if (complaintOptional.isEmpty()) {
            throw new RuntimeException("Complaint not found with ID: " + id);
        }

        Complaint complaint = complaintOptional.get();
        complaint.setRating(rating);
        complaint.setFeedback(feedback);
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint updatedComplaint = complaintRepository.save(complaint);
        return complaintMapper.toResponse(updatedComplaint);
    }

    /**
     * Delete a complaint.
     */
    public void deleteComplaint(String id) {
        if (!complaintRepository.existsById(id)) {
            throw new RuntimeException("Complaint not found with ID: " + id);
        }
        complaintRepository.deleteById(id);
    }

    /**
     * Get complaint statistics.
     */
    public ComplaintStatistics getStatistics() {
        long openCount = complaintRepository.countByStatus("OPEN");
        long inProgressCount = complaintRepository.countByStatus("IN_PROGRESS");
        long resolvedCount = complaintRepository.countByStatus("RESOLVED");
        long closedCount = complaintRepository.countByStatus("CLOSED");
        long totalCount = openCount + inProgressCount + resolvedCount + closedCount;

        return new ComplaintStatistics(openCount, inProgressCount, resolvedCount, closedCount, totalCount);
    }

    /**
     * Statistics DTO for complaints.
     */
    public static class ComplaintStatistics {
        public long openCount;
        public long inProgressCount;
        public long resolvedCount;
        public long closedCount;
        public long totalCount;

        public ComplaintStatistics(long openCount, long inProgressCount, long resolvedCount, long closedCount, long totalCount) {
            this.openCount = openCount;
            this.inProgressCount = inProgressCount;
            this.resolvedCount = resolvedCount;
            this.closedCount = closedCount;
            this.totalCount = totalCount;
        }
    }
}
