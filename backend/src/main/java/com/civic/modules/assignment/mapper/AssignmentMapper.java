package com.civic.modules.assignment.mapper;

import com.civic.modules.assignment.dto.AssignmentResponse;
import com.civic.modules.assignment.entity.Assignment;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Mapper for converting between Assignment entities and DTOs.
 */
@Component
public class AssignmentMapper {

    /** Map numeric priority (1-5) to human-readable label. */
    private static String priorityIntToLabel(String priorityStr) {
        if (priorityStr == null || priorityStr.isBlank()) return "MEDIUM";
        String upper = priorityStr.trim().toUpperCase();
        if (upper.equals("CRITICAL") || upper.equals("HIGH") || upper.equals("MEDIUM") 
            || upper.equals("LOW") || upper.equals("VERY_LOW")) {
            return upper;
        }
        try {
            int p = Integer.parseInt(priorityStr.trim());
            return switch (p) {
                case 5 -> "CRITICAL";
                case 4 -> "HIGH";
                case 3 -> "MEDIUM";
                case 2 -> "LOW";
                case 1 -> "VERY_LOW";
                default -> "MEDIUM";
            };
        } catch (NumberFormatException e) {
            return "MEDIUM";
        }
    }

    /**
     * Convert Assignment entity to AssignmentResponse DTO.
     */
    public AssignmentResponse toResponse(Assignment assignment) {
        AssignmentResponse response = new AssignmentResponse();
        response.setId(assignment.getId().toString());
        response.setComplaintId(assignment.getComplaint() != null ? assignment.getComplaint().getId().toString() : null);
        response.setComplaintNumber(assignment.getComplaint() != null ? assignment.getComplaint().getComplaintNumber() : null);
        response.setComplaintTitle(assignment.getComplaint() != null ? assignment.getComplaint().getTitle() : null);
        
        if (assignment.getComplaint() != null) {
            response.setComplaintDescription(assignment.getComplaint().getDescription());
            response.setComplaintAddress(assignment.getComplaint().getAddressText());
            if (assignment.getComplaint().getLocation() != null) {
                response.setComplaintLatitude(assignment.getComplaint().getLocation().getY());
                response.setComplaintLongitude(assignment.getComplaint().getLocation().getX());
            }
        }
        
        // Department info comes from complaint's department or worker's department
        if (assignment.getComplaint() != null && assignment.getComplaint().getDepartment() != null) {
            response.setDepartmentId(assignment.getComplaint().getDepartment().getId());
            response.setDepartmentName(assignment.getComplaint().getDepartment().getName());
        } else if (assignment.getWorker() != null && assignment.getWorker().getDepartment() != null) {
            response.setDepartmentId(assignment.getWorker().getDepartment().getId());
            response.setDepartmentName(assignment.getWorker().getDepartment().getName());
        }
        
        response.setAssignedWorkerId(assignment.getWorker() != null ? assignment.getWorker().getId() : null);
        response.setAssignedWorkerName(assignment.getWorker() != null && assignment.getWorker().getUser() != null 
                ? assignment.getWorker().getUser().getName() : null);
        
        response.setAssignmentType(Boolean.TRUE.equals(assignment.getIsAutoAssigned()) ? "AUTO" : "MANUAL");
        
        // Map backend statuses to frontend expected statuses
        String frontendStatus = assignment.getStatus().name();
        if ("ASSIGNED".equals(frontendStatus)) {
            frontendStatus = "PENDING";
        } else if ("ACCEPTED".equals(frontendStatus)) {
            frontendStatus = "ACKNOWLEDGED";
        }
        response.setStatus(frontendStatus);
        
        response.setIsAutoAssigned(assignment.getIsAutoAssigned());
        
        // Priority: derive from complaint entity
        String priorityLabel = "MEDIUM";
        if (assignment.getComplaint() != null && assignment.getComplaint().getPriority() != null) {
            priorityLabel = priorityIntToLabel(assignment.getComplaint().getPriority());
        }
        response.setPriority(priorityLabel);
        
        response.setSlaDeadline(assignment.getDeadlineAt());
        response.setNotes(assignment.getRejectionReason());
        response.setCreatedAt(assignment.getAssignedAt());
        response.setUpdatedAt(assignment.getAssignedAt());
        response.setAcceptedAt(assignment.getAcceptedAt());
        response.setCompletedAt(assignment.getCompletedAt());
        
        // Completion images
        response.setCompletionImages(assignment.getCompletionImages());
        
        // Check if overdue
        response.setOverdue(assignment.getDeadlineAt() != null && 
                LocalDateTime.now().isAfter(assignment.getDeadlineAt()) &&
                assignment.getStatus() != Assignment.AssignmentStatus.COMPLETED);
        
        return response;
    }
}
