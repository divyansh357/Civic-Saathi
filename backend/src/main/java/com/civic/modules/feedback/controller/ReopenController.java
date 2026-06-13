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
    public ResponseEntity<Map<String, Object>> requestReopen(
            @RequestBody Map<String, String> body,
            java.security.Principal principal) {
        String complaintId = body.get("complaintId");
        String reason = body.get("reason");
        ReopenRequest request = reopenService.requestReopen(complaintId, principal.getName(), reason);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "status", "success",
            "message", "Reopen request submitted successfully",
            "requestId", request.getId().toString()
        ));
    }

    private Map<String, Object> mapToResponse(ReopenRequest r) {
        return Map.of(
            "id", r.getId().toString(),
            "complaintId", r.getComplaint().getId().toString(),
            "userId", r.getUser().getId().toString(),
            "reason", r.getReason() != null ? r.getReason() : "",
            "reopenCount", r.getReopenCount() != null ? r.getReopenCount() : 0,
            "status", r.getStatus().name(),
            "createdAt", r.getCreatedAt()
        );
    }

    /** Officer approves a reopen request. */
    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveReopen(@PathVariable String id) {
        return ResponseEntity.ok(mapToResponse(reopenService.approveReopen(id)));
    }

    /** Officer rejects a reopen request. */
    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectReopen(@PathVariable String id) {
        return ResponseEntity.ok(mapToResponse(reopenService.rejectReopen(id)));
    }

    /** Get all pending reopen requests. */
    @GetMapping("/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingRequests() {
        return ResponseEntity.ok(reopenService.getPendingRequestsMap());
    }

    /** Get reopen history for a complaint. */
    @GetMapping("/complaint/{complaintId}")
    public ResponseEntity<List<Map<String, Object>>> getReopenHistory(@PathVariable String complaintId) {
        return ResponseEntity.ok(reopenService.getReopenHistoryMap(complaintId));
    }
}
