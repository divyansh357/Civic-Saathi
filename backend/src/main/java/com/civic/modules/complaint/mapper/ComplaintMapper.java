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

    /** Map numeric priority (1-5) to human-readable label. */
    private static String priorityIntToLabel(String priorityStr) {
        if (priorityStr == null || priorityStr.isBlank()) return "MEDIUM";
        // If it's already a label string, return as-is
        String upper = priorityStr.trim().toUpperCase();
        if (upper.equals("CRITICAL") || upper.equals("HIGH") || upper.equals("MEDIUM") 
            || upper.equals("LOW") || upper.equals("VERY_LOW")) {
            return upper;
        }
        // Try numeric conversion
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
     * Convert CreateComplaintRequest to Complaint entity.
     */
    public Complaint toEntity(CreateComplaintRequest request, String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        Department department = null;
        if (request.getDepartmentId() != null && !request.getDepartmentId().isEmpty()) {
            department = departmentRepository.findById(UUID.fromString(request.getDepartmentId()))
                    .orElse(null);
        }
        if (department == null && request.getCategory() != null && !request.getCategory().isEmpty()) {
            department = departmentRepository.findByCategoryType(request.getCategory(), org.springframework.data.domain.PageRequest.of(0, 1))
                    .stream()
                    .findFirst()
                    .orElse(null);
        }
        if (department == null) {
            department = departmentRepository.findAll(org.springframework.data.domain.PageRequest.of(0, 1))
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No departments available"));
        }

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
            complaint.setLatitude(request.getLatitude());
            complaint.setLongitude(request.getLongitude());
        }

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            complaint.setImageUrls(request.getImageUrls());
        }
        
        complaint.setVerificationMethod("PENDING");
        
        complaint.setAddressText(request.getLocation());
        complaint.setPriority(request.getPriority() != null ? request.getPriority().toString() : "3");
        complaint.setStatus(Complaint.ComplaintStatus.SUBMITTED);
        return complaint;
    }

    /**
     * Convert Complaint entity to ComplaintResponse DTO.
     * Populates ALL fields the frontend needs: names, priority label, address, etc.
     */
    public ComplaintResponse toResponse(Complaint complaint) {
        ComplaintResponse response = new ComplaintResponse();
        response.setId(complaint.getId().toString());
        response.setComplaintNumber(complaint.getComplaintNumber());
        response.setTitle(complaint.getTitle());
        response.setDescription(complaint.getDescription());
        
        // Handle category - get first category or null
        response.setCategory(complaint.getCategories().isEmpty() ? null : 
                complaint.getCategories().iterator().next().getName());
        
        response.setStatus(complaint.getStatus().name());

        // --- User info ---
        if (complaint.getCreatedBy() != null) {
            response.setUserId(complaint.getCreatedBy().getId());
            response.setUserName(complaint.getCreatedBy().getName());
        }

        // --- Department info ---
        if (complaint.getDepartment() != null) {
            response.setDepartmentId(complaint.getDepartment().getId());
            response.setDepartmentName(complaint.getDepartment().getName());
        }

        // --- Assigned worker info ---
        if (complaint.getAssignedWorker() != null) {
            response.setAssignedWorkerId(complaint.getAssignedWorker().getId());
            if (complaint.getAssignedWorker().getUser() != null) {
                response.setAssignedWorkerName(complaint.getAssignedWorker().getUser().getName());
            }
        }
        
        // Extract lat/lng
        response.setLatitude(complaint.getLatitude());
        response.setLongitude(complaint.getLongitude());
        
        // Images and Verification
        response.setImageUrls(complaint.getImageUrls());
        response.setVerificationMethod(complaint.getVerificationMethod());
        response.setAiSummary(complaint.getAiSummary());
        
        // Address — set both fields for compatibility
        response.setLocation(complaint.getAddressText());
        response.setAddress(complaint.getAddressText());
        
        // Handle removed fields with defaults/nulls
        response.setResolution(null);
        response.setCreatedAt(complaint.getCreatedAt());
        response.setUpdatedAt(complaint.getUpdatedAt());
        response.setResolvedAt(complaint.getResolvedAt());
        response.setSlaDeadline(complaint.getSlaDeadline());
        
        // Priority: convert numeric → label
        response.setPriority(priorityIntToLabel(complaint.getPriority()));
        
        response.setRating(null); // Moved to Feedback entity
        response.setFeedback(null); // Moved to Feedback entity
        return response;
    }
}
