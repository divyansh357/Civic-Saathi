package com.civic.modules.feedback.controller;

import com.civic.modules.feedback.entity.ReopenRequest;
import com.civic.modules.feedback.service.ReopenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for complaint reopen requests.
 */
@RestController
@RequestMapping("/api/v1/reopen-requests")
public class ReopenController {

    @Autowired
    private ReopenService reopenService;

    /** Citizen requests to reopen a complaint. */
    @PostMapping
    public ResponseEntity<ReopenRequest> requestReopen(
            @RequestBody Map<String, String> body,
            @RequestHeader("User-Id") String userId) {
        String complaintId = body.get("complaintId");
        String reason = body.get("reason");
        ReopenRequest request = reopenService.requestReopen(complaintId, userId, reason);
        return ResponseEntity.status(HttpStatus.CREATED).body(request);
    }

    /** Officer approves a reopen request. */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ReopenRequest> approveReopen(@PathVariable String id) {
        return ResponseEntity.ok(reopenService.approveReopen(id));
    }

    /** Officer rejects a reopen request. */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ReopenRequest> rejectReopen(@PathVariable String id) {
        return ResponseEntity.ok(reopenService.rejectReopen(id));
    }

    /** Get all pending reopen requests. */
    @GetMapping("/pending")
    public ResponseEntity<List<ReopenRequest>> getPendingRequests() {
        return ResponseEntity.ok(reopenService.getPendingRequests());
    }

    /** Get reopen history for a complaint. */
    @GetMapping("/complaint/{complaintId}")
    public ResponseEntity<List<ReopenRequest>> getReopenHistory(@PathVariable String complaintId) {
        return ResponseEntity.ok(reopenService.getReopenHistory(complaintId));
    }
}
