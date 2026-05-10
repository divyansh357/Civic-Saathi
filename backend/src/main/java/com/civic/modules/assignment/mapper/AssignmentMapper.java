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
        response.setId(assignment.getId());
        response.setComplaintId(assignment.getComplaintId());
        response.setComplaintTitle(assignment.getComplaint() != null ? assignment.getComplaint().getTitle() : null);
        response.setDepartmentId(assignment.getDepartmentId());
        response.setDepartmentName(assignment.getDepartment() != null ? assignment.getDepartment().getName() : null);
        response.setAssignedWorkerId(assignment.getAssignedWorkerId());
        response.setAssignedWorkerName(assignment.getAssignedWorker() != null && assignment.getAssignedWorker().getUser() != null 
                ? assignment.getAssignedWorker().getUser().getName() : null);
        response.setAssignmentType(assignment.getAssignmentType());
        response.setStatus(assignment.getStatus());
        response.setPriority(assignment.getPriority());
        response.setSlaDeadline(assignment.getSlaDeadline());
        response.setNotes(assignment.getNotes());
        response.setCreatedAt(assignment.getCreatedAt());
        response.setUpdatedAt(assignment.getUpdatedAt());
        response.setAcceptedAt(assignment.getAcceptedAt());
        response.setCompletedAt(assignment.getCompletedAt());
        
        // Check if overdue
        response.setOverdue(assignment.getSlaDeadline() != null && 
                LocalDateTime.now().isAfter(assignment.getSlaDeadline()) &&
                !"COMPLETED".equals(assignment.getStatus()));
        
        return response;
    }
}
