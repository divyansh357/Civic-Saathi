package com.civic.modules.complaint.mapper;

import com.civic.modules.complaint.dto.CreateComplaintRequest;
import com.civic.modules.complaint.dto.ComplaintResponse;
import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.user.entity.User;
import com.civic.modules.user.repository.UserRepository;
import com.civic.modules.department.entity.Department;
import com.civic.modules.department.repository.DepartmentRepository;
import com.civic.modules.geography.entity.City;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Mapper for converting between Complaint entities and DTOs.
 */
@Component
public class ComplaintMapper {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory();

    /**
     * Convert CreateComplaintRequest to Complaint entity.
     */
    public Complaint toEntity(CreateComplaintRequest request, String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        Department department = departmentRepository.findById(UUID.fromString(request.getDepartmentId()))
                .orElseThrow(() -> new RuntimeException("Department not found with ID: " + request.getDepartmentId()));

        // Get city from user or department
        City city = user.getCity() != null ? user.getCity() : department.getCity();
        if (city == null) {
            throw new RuntimeException("No city found for user or department");
        }

        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setCreatedBy(user);
        complaint.setDepartment(department);
        complaint.setCity(city);
        
        // Create PostGIS Point from lat/lng
        if (request.getLatitude() != null && request.getLongitude() != null) {
            Point point = geometryFactory.createPoint(new Coordinate(request.getLongitude(), request.getLatitude()));
            point.setSRID(4326);
            complaint.setLocation(point);
        }
        
        complaint.setAddressText(request.getLocation());
        complaint.setPriority(request.getPriority() != null ? request.getPriority().toString() : "3");
        complaint.setStatus(Complaint.ComplaintStatus.SUBMITTED);
        return complaint;
    }

    /**
     * Convert Complaint entity to ComplaintResponse DTO.
     */
    public ComplaintResponse toResponse(Complaint complaint) {
        ComplaintResponse response = new ComplaintResponse();
        response.setId(complaint.getId().toString());
        response.setTitle(complaint.getTitle());
        response.setDescription(complaint.getDescription());
        
        // Handle category - get first category or null
        response.setCategory(complaint.getCategories().isEmpty() ? null : 
                complaint.getCategories().iterator().next().getName());
        
        response.setStatus(complaint.getStatus().name());
        response.setUserId(complaint.getCreatedBy() != null ? complaint.getCreatedBy().getId() : null);
        response.setDepartmentId(complaint.getDepartment() != null ? complaint.getDepartment().getId() : null);
        response.setAssignedWorkerId(complaint.getAssignedWorker() != null ? complaint.getAssignedWorker().getId() : null);
        
        // Extract lat/lng from PostGIS Point
        if (complaint.getLocation() != null) {
            response.setLatitude(complaint.getLocation().getY());
            response.setLongitude(complaint.getLocation().getX());
        }
        
        response.setLocation(complaint.getAddressText());
        
        // Handle removed fields with defaults/nulls
        response.setResolution(null); // Moved to separate entity
        response.setCreatedAt(complaint.getCreatedAt());
        response.setUpdatedAt(complaint.getUpdatedAt());
        response.setResolvedAt(null); // Moved to status history
        
        // Handle priority conversion
        try {
            response.setPriority(complaint.getPriority() != null ? Integer.parseInt(complaint.getPriority()) : 3);
        } catch (NumberFormatException e) {
            response.setPriority(3); // Default priority
        }
        
        response.setRating(null); // Moved to Feedback entity
        response.setFeedback(null); // Moved to Feedback entity
        return response;
    }
}
