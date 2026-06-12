package com.civic.modules.assignment.controller;

import com.civic.modules.assignment.dto.AssignmentRequest;
import com.civic.modules.assignment.dto.AssignmentResponse;
import com.civic.modules.assignment.dto.AutoAssignmentRequest;
import com.civic.modules.assignment.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.format.annotation.DateTimeFormat;

/**
 * REST controller for assignment management.
 */
@RestController
@RequestMapping("/api/v1/assignments")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    /**
     * Auto-assign complaint to department and worker.
     */
    @PostMapping("/auto-assign")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> autoAssignComplaint(@Valid @RequestBody AutoAssignmentRequest request) {
        AssignmentResponse assignment = assignmentService.autoAssignComplaint(request);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Complaint auto-assigned successfully");
        response.put("data", assignment);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Manually assign complaint to specific worker.
     */
    @PostMapping("/manual-assign")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> manualAssignComplaint(
            @Valid @RequestBody AssignmentRequest request,
            java.security.Principal principal) {
        String userId = principal.getName();
        AssignmentResponse assignment = assignmentService.manualAssignComplaint(request, userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Complaint manually assigned successfully");
        response.put("data", assignment);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Reassign complaint to different worker.
     */
    @PutMapping("/{assignmentId}/reassign")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> reassignComplaint(
            @PathVariable String assignmentId,
            @RequestParam String newWorkerId,
            @RequestParam(required = false) String reason) {
        
        AssignmentResponse assignment = assignmentService.reassignComplaint(assignmentId, newWorkerId, reason);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Complaint reassigned successfully");
        response.put("data", assignment);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Manually update the SLA deadline for an assignment.
     */
    @PutMapping("/{assignmentId}/sla")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> updateSlaDeadline(
            @PathVariable String assignmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newDeadline) {
        
        AssignmentResponse assignment = assignmentService.updateSlaDeadline(assignmentId, newDeadline);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "SLA deadline updated successfully");
        response.put("data", assignment);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get assignments by department.
     */
    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getAssignmentsByDepartment(
            @PathVariable String departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "assignedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<AssignmentResponse> assignments = assignmentService.getAssignmentsByDepartment(departmentId, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", assignments.getContent());
        response.put("currentPage", assignments.getNumber());
        response.put("totalItems", assignments.getTotalElements());
        response.put("totalPages", assignments.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get assignments by worker.
     */
    @GetMapping("/worker/{workerId}")
    @PreAuthorize("hasAnyRole('WORKER', 'OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getAssignmentsByWorker(
            @PathVariable String workerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "assignedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<AssignmentResponse> assignments = assignmentService.getAssignmentsByWorker(workerId, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", assignments.getContent());
        response.put("currentPage", assignments.getNumber());
        response.put("totalItems", assignments.getTotalElements());
        response.put("totalPages", assignments.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get completed assignments by worker.
     */
    @GetMapping("/worker/{workerId}/completed")
    @PreAuthorize("hasAnyRole('WORKER', 'OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getCompletedAssignmentsByWorker(
            @PathVariable String workerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "assignedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<AssignmentResponse> assignments = assignmentService.getCompletedAssignmentsByWorker(workerId, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", assignments.getContent());
        response.put("currentPage", assignments.getNumber());
        response.put("totalItems", assignments.getTotalElements());
        response.put("totalPages", assignments.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get overdue assignments.
     */
    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getOverdueAssignments() {
        List<AssignmentResponse> assignments = assignmentService.getOverdueAssignments();
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", assignments);
        response.put("count", assignments.size());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Worker acknowledges an assignment.
     */
    @PostMapping("/{assignmentId}/acknowledge")
    @PreAuthorize("hasAnyRole('WORKER', 'OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> acknowledgeAssignment(@PathVariable String assignmentId) {
        AssignmentResponse assignment = assignmentService.acknowledgeAssignment(assignmentId);
        return ResponseEntity.ok(Map.of("status", "success", "data", assignment));
    }

    /**
     * Worker starts working on an assignment.
     */
    @PostMapping("/{assignmentId}/start")
    @PreAuthorize("hasAnyRole('WORKER', 'OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> startAssignment(@PathVariable String assignmentId) {
        AssignmentResponse assignment = assignmentService.startAssignment(assignmentId);
        return ResponseEntity.ok(Map.of("status", "success", "data", assignment));
    }

    /**
     * Worker completes an assignment.
     */
    @PostMapping("/{assignmentId}/complete")
    @PreAuthorize("hasAnyRole('WORKER', 'OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> completeAssignment(
            @PathVariable String assignmentId,
            @RequestBody @Valid com.civic.modules.assignment.dto.AssignmentCompleteRequest request) {
        // Here we can use notes if needed, but the interface requires images.
        AssignmentResponse assignment = assignmentService.completeAssignment(assignmentId, "Completed via App", request.getImages());
        return ResponseEntity.ok(Map.of("status", "success", "data", assignment));
    }

    /**
     * Worker rejects an assignment.
     */
    @PostMapping("/{assignmentId}/reject")
    @PreAuthorize("hasAnyRole('WORKER', 'OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> rejectAssignment(
            @PathVariable String assignmentId,
            @RequestBody @Valid com.civic.modules.assignment.dto.AssignmentRejectRequest request) {
        AssignmentResponse assignment = assignmentService.rejectAssignment(assignmentId, request.getReason());
        return ResponseEntity.ok(Map.of("status", "success", "data", assignment));
    }

    /**
     * Get all assignments (admin/officer view).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllAssignments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("assignedAt").descending());
        Page<AssignmentResponse> assignments = assignmentService.getAllAssignments(pageable);
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "data", assignments.getContent(),
            "totalItems", assignments.getTotalElements(),
            "totalPages", assignments.getTotalPages()
        ));
    }

    /**
     * Trigger escalation for overdue assignments.
     */
    @PostMapping("/escalate-overdue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> escalateOverdueAssignments() {
        assignmentService.escalateOverdueAssignments();
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Overdue assignments escalated successfully");
        
        return ResponseEntity.ok(response);
    }
}
