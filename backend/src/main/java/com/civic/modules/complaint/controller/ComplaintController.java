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

/**
 * REST Controller for complaint management endpoints.
 */
@RestController
@RequestMapping("/api/v1/complaints")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    /**
     * Create a new complaint.
     */
    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(
            @RequestBody CreateComplaintRequest request,
            @RequestHeader("User-Id") String userId) {
        ComplaintResponse response = complaintService.createComplaint(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get complaint by ID.
     */
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
            @RequestHeader("User-Id") String userId,
            Pageable pageable) {
        Page<ComplaintResponse> complaints = complaintService.getComplaintsByUserId(userId, pageable);
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
    @PutMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateComplaintStatus(
            @PathVariable String id,
            @RequestBody UpdateComplaintStatusRequest request) {
        ComplaintResponse response = complaintService.updateComplaintStatus(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Submit feedback for a complaint.
     */
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
