package com.civic.modules.complaint.mapper;

import com.civic.modules.complaint.dto.CreateComplaintRequest;
import com.civic.modules.complaint.dto.ComplaintResponse;
import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.user.entity.User;
import com.civic.modules.user.repository.UserRepository;
import com.civic.modules.department.entity.Department;
import com.civic.modules.department.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between Complaint entities and DTOs.
 */
@Component
public class ComplaintMapper {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    /**
     * Convert CreateComplaintRequest to Complaint entity.
     */
    public Complaint toEntity(CreateComplaintRequest request, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found with ID: " + request.getDepartmentId()));

        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(request.getCategory());
        complaint.setUser(user);
        complaint.setDepartment(department);
        complaint.setLatitude(request.getLatitude());
        complaint.setLongitude(request.getLongitude());
        complaint.setLocation(request.getLocation());
        complaint.setPriority(request.getPriority() != null ? request.getPriority() : 3);
        complaint.setStatus("OPEN");
        return complaint;
    }

    /**
     * Convert Complaint entity to ComplaintResponse DTO.
     */
    public ComplaintResponse toResponse(Complaint complaint) {
        ComplaintResponse response = new ComplaintResponse();
        response.setId(complaint.getId());
        response.setTitle(complaint.getTitle());
        response.setDescription(complaint.getDescription());
        response.setCategory(complaint.getCategory());
        response.setStatus(complaint.getStatus());
        response.setUserId(complaint.getUserId());
        response.setDepartmentId(complaint.getDepartmentId());
        response.setAssignedWorkerId(complaint.getAssignedWorkerId());
        response.setLatitude(complaint.getLatitude());
        response.setLongitude(complaint.getLongitude());
        response.setLocation(complaint.getLocation());
        response.setResolution(complaint.getResolution());
        response.setCreatedAt(complaint.getCreatedAt());
        response.setUpdatedAt(complaint.getUpdatedAt());
        response.setResolvedAt(complaint.getResolvedAt());
        response.setPriority(complaint.getPriority());
        response.setRating(complaint.getRating());
        response.setFeedback(complaint.getFeedback());
        return response;
    }
}
