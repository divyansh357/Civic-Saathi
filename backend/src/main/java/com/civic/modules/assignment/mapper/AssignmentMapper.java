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

    /**
     * Convert Assignment entity to AssignmentResponse DTO.
     */
    public AssignmentResponse toResponse(Assignment assignment) {
        AssignmentResponse response = new AssignmentResponse();
        response.setId(assignment.getId().toString());
        response.setComplaintId(assignment.getComplaint() != null ? assignment.getComplaint().getId().toString() : null);
        response.setComplaintTitle(assignment.getComplaint() != null ? assignment.getComplaint().getTitle() : null);
        
        // Department info comes from worker's department
        response.setDepartmentId(assignment.getWorker() != null && assignment.getWorker().getDepartment() != null 
                ? assignment.getWorker().getDepartment().getId() : null);
        response.setDepartmentName(assignment.getWorker() != null && assignment.getWorker().getDepartment() != null 
                ? assignment.getWorker().getDepartment().getName() : null);
        
        response.setAssignedWorkerId(assignment.getWorker() != null ? assignment.getWorker().getId() : null);
        response.setAssignedWorkerName(assignment.getWorker() != null && assignment.getWorker().getUser() != null 
                ? assignment.getWorker().getUser().getName() : null);
        
        // Handle removed fields with defaults
        response.setAssignmentType("AUTO"); // Default since field removed
        response.setStatus(assignment.getStatus().name());
        response.setPriority(3); // Default priority since field removed
        response.setSlaDeadline(assignment.getDeadlineAt());
        response.setNotes(assignment.getRejectionReason()); // Use rejection reason as notes
        response.setCreatedAt(assignment.getAssignedAt());
        response.setUpdatedAt(assignment.getAssignedAt()); // Use assigned time as updated time
        response.setAcceptedAt(assignment.getAcceptedAt());
        response.setCompletedAt(assignment.getCompletedAt());
        
        // Check if overdue
        response.setOverdue(assignment.getDeadlineAt() != null && 
                LocalDateTime.now().isAfter(assignment.getDeadlineAt()) &&
                assignment.getStatus() != Assignment.AssignmentStatus.COMPLETED);
        
        return response;
    }
}
