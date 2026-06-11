package com.civic.modules.complaint.controller;

import com.civic.modules.complaint.entity.ComplaintComment;
import com.civic.modules.complaint.entity.ComplaintSupportVote;
import com.civic.modules.complaint.repository.ComplaintCommentRepository;
import com.civic.modules.complaint.repository.ComplaintRepository;
import com.civic.modules.complaint.repository.ComplaintSupportVoteRepository;
import com.civic.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for complaint comments and support votes (public transparency).
 */
@RestController
@RequestMapping("/api/v1/complaints")
public class ComplaintCommentController {

    @Autowired private ComplaintCommentRepository commentRepository;
    @Autowired private ComplaintSupportVoteRepository voteRepository;
    @Autowired private ComplaintRepository complaintRepository;
    @Autowired private UserRepository userRepository;

    // ── Comments ──────────────────────────────────────────────────────────────

    @GetMapping("/{complaintId}/comments")
    public ResponseEntity<List<Map<String, Object>>> getComments(@PathVariable String complaintId) {
        List<Map<String, Object>> comments = commentRepository
            .findByComplaintIdOrderByCreatedAtAsc(UUID.fromString(complaintId))
            .stream()
            .map(c -> Map.<String, Object>of(
                "id", c.getId().toString(),
                "message", c.getMessage() != null ? c.getMessage() : "",
                "userName", c.getUser() != null ? c.getUser().getName() : "Unknown",
                "userId", c.getUser() != null ? c.getUser().getId() : "",
                "createdAt", c.getCreatedAt().toString()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/{complaintId}/comments")
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable String complaintId,
            @RequestBody Map<String, String> body,
            @RequestHeader("User-Id") String userId) {

        var complaint = complaintRepository.findById(UUID.fromString(complaintId))
            .orElseThrow(() -> new RuntimeException("Complaint not found"));
        var user = userRepository.findById(UUID.fromString(userId))
            .orElseThrow(() -> new RuntimeException("User not found"));

        ComplaintComment comment = new ComplaintComment(complaint, user, body.get("message"));
        ComplaintComment saved = commentRepository.save(comment);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", saved.getId().toString(),
            "message", saved.getMessage(),
            "userName", user.getName(),
            "createdAt", saved.getCreatedAt().toString()
        ));
    }

    // ── Support Votes ─────────────────────────────────────────────────────────

    @GetMapping("/{complaintId}/votes")
    public ResponseEntity<Map<String, Object>> getVoteCount(
            @PathVariable String complaintId,
            @RequestHeader(value = "User-Id", required = false) String userId) {

        UUID cid = UUID.fromString(complaintId);
        long count = voteRepository.countByComplaintId(cid);
        boolean hasVoted = userId != null && voteRepository.existsByComplaintIdAndUserId(cid, UUID.fromString(userId));

        return ResponseEntity.ok(Map.of("count", count, "hasVoted", hasVoted));
    }

    @PostMapping("/{complaintId}/vote")
    public ResponseEntity<Map<String, Object>> toggleVote(
            @PathVariable String complaintId,
            @RequestHeader("User-Id") String userId) {

        UUID cid = UUID.fromString(complaintId);
        UUID uid = UUID.fromString(userId);

        var existing = voteRepository.findByComplaintIdAndUserId(cid, uid);
        if (existing.isPresent()) {
            voteRepository.delete(existing.get());
            return ResponseEntity.ok(Map.of("voted", false, "count", voteRepository.countByComplaintId(cid)));
        }

        var complaint = complaintRepository.findById(cid)
            .orElseThrow(() -> new RuntimeException("Complaint not found"));
        var user = userRepository.findById(uid)
            .orElseThrow(() -> new RuntimeException("User not found"));

        voteRepository.save(new ComplaintSupportVote(complaint, user));
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("voted", true, "count", voteRepository.countByComplaintId(cid)));
    }
}
