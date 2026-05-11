package com.civic.modules.feedback.service;

import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.complaint.repository.ComplaintRepository;
import com.civic.modules.feedback.dto.FeedbackRequest;
import com.civic.modules.feedback.dto.FeedbackResponse;
import com.civic.modules.feedback.entity.Feedback;
import com.civic.modules.feedback.repository.FeedbackRepository;
import com.civic.modules.user.entity.User;
import com.civic.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for citizen feedback on resolved complaints.
 */
@Service
@Transactional
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Submit feedback for a resolved complaint.
     */
    public FeedbackResponse submitFeedback(FeedbackRequest request, String userId) {
        UUID complaintUuid = UUID.fromString(request.getComplaintId());
        UUID userUuid = UUID.fromString(userId);

        Complaint complaint = complaintRepository.findById(complaintUuid)
            .orElseThrow(() -> new RuntimeException("Complaint not found: " + request.getComplaintId()));

        // Only allow feedback on resolved or closed complaints
        if (complaint.getStatus() != Complaint.ComplaintStatus.RESOLVED
                && complaint.getStatus() != Complaint.ComplaintStatus.CLOSED
                && complaint.getStatus() != Complaint.ComplaintStatus.VERIFIED_FOR_CLOSURE) {
            throw new IllegalStateException("Feedback can only be submitted for resolved or closed complaints");
        }

        // Prevent duplicate feedback
        if (feedbackRepository.findByComplaintIdAndUserId(complaintUuid, userUuid).isPresent()) {
            throw new IllegalStateException("You have already submitted feedback for this complaint");
        }

        User user = userRepository.findById(UUID.fromString(userId))
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Feedback feedback = new Feedback(complaint, user, request.getRating());
        feedback.setComment(request.getComment());
        if (request.getIsSatisfied() != null) {
            feedback.setIsSatisfied(request.getIsSatisfied());
        } else {
            feedback.setIsSatisfied(request.getRating() >= 3);
        }

        Feedback saved = feedbackRepository.save(feedback);
        return toResponse(saved);
    }

    /**
     * Get all feedback for a complaint.
     */
    @Transactional(readOnly = true)
    public List<FeedbackResponse> getFeedbackForComplaint(String complaintId) {
        return feedbackRepository.findByComplaintId(UUID.fromString(complaintId))
            .stream().map(this::toResponse).toList();
    }

    /**
     * Get average rating for a complaint.
     */
    @Transactional(readOnly = true)
    public Double getAverageRating(String complaintId) {
        return feedbackRepository.avgRatingByComplaintId(UUID.fromString(complaintId));
    }

    /**
     * Get overall platform satisfaction score.
     */
    @Transactional(readOnly = true)
    public Double getOverallSatisfactionScore() {
        Double avg = feedbackRepository.avgRatingOverall();
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    private FeedbackResponse toResponse(Feedback f) {
        FeedbackResponse r = new FeedbackResponse();
        r.setId(f.getId().toString());
        r.setComplaintId(f.getComplaint().getId().toString());
        r.setUserId(f.getUser().getId());
        r.setUserName(f.getUser().getName());
        r.setRating(f.getRating());
        r.setComment(f.getComment());
        r.setIsSatisfied(f.getIsSatisfied());
        r.setCreatedAt(f.getCreatedAt());
        return r;
    }
}
