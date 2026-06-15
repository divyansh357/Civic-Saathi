package com.civic.modules.complaint.controller;

import com.civic.modules.complaint.dto.CreateComplaintRequest;
import com.civic.modules.complaint.dto.ComplaintResponse;
import com.civic.modules.complaint.dto.UpdateComplaintStatusRequest;
import com.civic.modules.complaint.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

/**
 * REST Controller for complaint management endpoints.
 */
@RestController
@RequestMapping("/api/v1/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    /**
     * Get public complaints (transparency module — no auth required).
     */
    @Cacheable(value = "complaintData", key = "'public_complaints_page_' + #pageable.pageNumber")
    @GetMapping("/public")
    public ResponseEntity<Page<ComplaintResponse>> getPublicComplaints(Pageable pageable) {
        Page<ComplaintResponse> complaints = complaintService.getComplaintsByStatus("SUBMITTED", pageable);
        return ResponseEntity.ok(complaints);
    }

    /**
     * Search complaints by keyword.
     */
    @GetMapping("/search")
    public ResponseEntity<Page<ComplaintResponse>> searchComplaints(
            @RequestParam String q,
            Pageable pageable) {
        Page<ComplaintResponse> complaints = complaintService.searchComplaints(q, pageable);
        return ResponseEntity.ok(complaints);
    }

    /**
     * Get all complaints (officer/admin view with optional filters).
     */
    @GetMapping
    public ResponseEntity<Page<ComplaintResponse>> getAllComplaints(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        Page<ComplaintResponse> complaints = complaintService.getAllComplaints(status, search, pageable);
        return ResponseEntity.ok(complaints);
    }

    /**
     * Create a new complaint.
     */
    @CacheEvict(value = {"complaintData", "analyticsData"}, allEntries = true)
    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(
            @RequestBody CreateComplaintRequest request,
            java.security.Principal principal) {
        ComplaintResponse response = complaintService.createComplaint(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get complaint by ID.
     */
    @Cacheable(value = "complaintData", key = "'complaint_' + #id")
    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getComplaintById(@PathVariable String id) {
        ComplaintResponse response = complaintService.getComplaintById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all complaints for the current user.
     */
    @GetMapping("/user/my-complaints")
    public ResponseEntity<Page<ComplaintResponse>> getMyComplaints(
            java.security.Principal principal,
            Pageable pageable) {
        Page<ComplaintResponse> complaints = complaintService.getComplaintsByUserId(principal.getName(), pageable);
        return ResponseEntity.ok(complaints);
    }

    /**
     * Get all complaints for a department.
     */
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<Page<ComplaintResponse>> getComplaintsByDepartment(
            @PathVariable String departmentId,
            Pageable pageable) {
        Page<ComplaintResponse> complaints = complaintService.getComplaintsByDepartmentId(departmentId, pageable);
        return ResponseEntity.ok(complaints);
    }

    /**
     * Get all complaints with a specific status.
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<ComplaintResponse>> getComplaintsByStatus(
            @PathVariable String status,
            Pageable pageable) {
        Page<ComplaintResponse> complaints = complaintService.getComplaintsByStatus(status, pageable);
        return ResponseEntity.ok(complaints);
    }

    /**
     * Update complaint status.
     */
    @CacheEvict(value = {"complaintData", "analyticsData"}, allEntries = true)
    @PutMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateComplaintStatus(
            @PathVariable String id,
            @RequestBody UpdateComplaintStatusRequest request) {
        ComplaintResponse response = complaintService.updateComplaintStatus(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Escalate a complaint manually.
     */
    @CacheEvict(value = {"complaintData", "analyticsData"}, allEntries = true)
    @PostMapping("/{id}/escalate")
    public ResponseEntity<ComplaintResponse> escalateComplaint(
            @PathVariable String id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Manual escalation") : "Manual escalation";
        ComplaintResponse response = complaintService.escalateComplaint(id, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * Trigger auto-escalation of SLA-breached complaints (admin/scheduler).
     */
    @CacheEvict(value = {"complaintData", "analyticsData"}, allEntries = true)
    @PostMapping("/escalate/sla-breached")
    public ResponseEntity<java.util.Map<String, Object>> autoEscalateSlaBreached() {
        int count = complaintService.autoEscalateSlaBreached();
        return ResponseEntity.ok(java.util.Map.of("escalated", count));
    }

    /**
     * Submit feedback for a complaint.
     */
    @CacheEvict(value = {"complaintData", "analyticsData"}, allEntries = true)
    @PostMapping("/{id}/feedback")
    public ResponseEntity<ComplaintResponse> submitFeedback(
            @PathVariable String id,
            @RequestParam Integer rating,
            @RequestParam String feedback) {
        ComplaintResponse response = complaintService.submitFeedback(id, rating, feedback);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a complaint.
     */
    @CacheEvict(value = {"complaintData", "analyticsData"}, allEntries = true)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComplaint(@PathVariable String id) {
        complaintService.deleteComplaint(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get complaint statistics.
     */
    @GetMapping("/stats/overview")
    public ResponseEntity<ComplaintService.ComplaintStatistics> getStatistics() {
        ComplaintService.ComplaintStatistics stats = complaintService.getStatistics();
        return ResponseEntity.ok(stats);
    }
}
