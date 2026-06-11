package com.civic.modules.feedback.controller;

import com.civic.modules.feedback.dto.FeedbackRequest;
import com.civic.modules.feedback.dto.FeedbackResponse;
import com.civic.modules.feedback.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for citizen feedback on complaints.
 */
@RestController
@RequestMapping("/api/v1/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    /** Submit feedback for a resolved complaint. */
    @PostMapping
    public ResponseEntity<FeedbackResponse> submitFeedback(
            @Valid @RequestBody FeedbackRequest request,
            @RequestHeader("User-Id") String userId) {
        FeedbackResponse response = feedbackService.submitFeedback(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** Get all feedback for a complaint. */
    @GetMapping("/complaint/{complaintId}")
    public ResponseEntity<List<FeedbackResponse>> getFeedbackForComplaint(
            @PathVariable String complaintId) {
        return ResponseEntity.ok(feedbackService.getFeedbackForComplaint(complaintId));
    }

    /** Get average rating for a complaint. */
    @GetMapping("/complaint/{complaintId}/rating")
    public ResponseEntity<Map<String, Object>> getAverageRating(@PathVariable String complaintId) {
        Double avg = feedbackService.getAverageRating(complaintId);
        return ResponseEntity.ok(Map.of("complaintId", complaintId, "averageRating", avg != null ? avg : 0.0));
    }

    /** Get overall platform satisfaction score. */
    @GetMapping("/satisfaction-score")
    public ResponseEntity<Map<String, Object>> getOverallSatisfactionScore() {
        Double score = feedbackService.getOverallSatisfactionScore();
        return ResponseEntity.ok(Map.of("satisfactionScore", score));
    }
}
