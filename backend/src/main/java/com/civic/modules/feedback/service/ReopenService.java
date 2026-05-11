package com.civic.modules.feedback.service;

import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.complaint.repository.ComplaintRepository;
import com.civic.modules.complaint.workflow.ComplaintWorkflow;
import com.civic.modules.feedback.entity.ReopenRequest;
import com.civic.modules.feedback.repository.ReopenRequestRepository;
import com.civic.modules.user.entity.User;
import com.civic.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for complaint reopen requests.
 */
@Service
@Transactional
public class ReopenService {

    @Autowired
    private ReopenRequestRepository reopenRequestRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ComplaintWorkflow complaintWorkflow;

    /**
     * Citizen requests to reopen a closed/resolved complaint.
     */
    public ReopenRequest requestReopen(String complaintId, String userId, String reason) {
        UUID complaintUuid = UUID.fromString(complaintId);

        Complaint complaint = complaintRepository.findById(complaintUuid)
            .orElseThrow(() -> new RuntimeException("Complaint not found: " + complaintId));

        if (!complaintWorkflow.canReopen(complaint.getStatus())) {
            throw new IllegalStateException("Complaint cannot be reopened from status: " + complaint.getStatus());
        }

        long existingReopens = reopenRequestRepository.countByComplaintId(complaintUuid);
        if (existingReopens >= 6) {
            throw new IllegalStateException("Maximum reopen limit (6) reached for this complaint");
        }

        User user = userRepository.findById(UUID.fromString(userId))
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        ReopenRequest request = new ReopenRequest(complaint, user, reason);
        request.setReopenCount((int) existingReopens + 1);
        return reopenRequestRepository.save(request);
    }

    /**
     * Officer approves a reopen request.
     */
    public ReopenRequest approveReopen(String requestId) {
        ReopenRequest request = reopenRequestRepository.findById(UUID.fromString(requestId))
            .orElseThrow(() -> new RuntimeException("Reopen request not found: " + requestId));

        if (request.getStatus() != ReopenRequest.ReopenStatus.REQUESTED) {
            throw new IllegalStateException("Request is already " + request.getStatus());
        }

        request.approve();
        reopenRequestRepository.save(request);

        // Transition complaint to REOPENED
        Complaint complaint = request.getComplaint();
        complaintWorkflow.applyTransition(complaint, "REOPENED");
        complaintRepository.save(complaint);

        return request;
    }

    /**
     * Officer rejects a reopen request.
     */
    public ReopenRequest rejectReopen(String requestId) {
        ReopenRequest request = reopenRequestRepository.findById(UUID.fromString(requestId))
            .orElseThrow(() -> new RuntimeException("Reopen request not found: " + requestId));

        if (request.getStatus() != ReopenRequest.ReopenStatus.REQUESTED) {
            throw new IllegalStateException("Request is already " + request.getStatus());
        }

        request.reject();
        return reopenRequestRepository.save(request);
    }

    /** Get all pending reopen requests (for officer dashboard). */
    @Transactional(readOnly = true)
    public List<ReopenRequest> getPendingRequests() {
        return reopenRequestRepository.findByStatus(ReopenRequest.ReopenStatus.REQUESTED);
    }

    /** Get reopen history for a complaint. */
    @Transactional(readOnly = true)
    public List<ReopenRequest> getReopenHistory(String complaintId) {
        return reopenRequestRepository.findByComplaintId(UUID.fromString(complaintId));
    }
}
