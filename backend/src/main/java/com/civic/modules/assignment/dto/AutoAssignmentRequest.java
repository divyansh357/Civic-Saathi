package com.civic.modules.assignment.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for auto-assignment request.
 * Only complaintId is required — the system looks up category, city, lat/lng from the complaint.
 */
public class AutoAssignmentRequest {

    @NotBlank(message = "Complaint ID is required")
    private String complaintId;

    // Optional overrides — system will use complaint data if not provided
    private String category;
    private String city;
    private Double latitude;
    private Double longitude;
    private Integer priority;

    // Getters and Setters
    public String getComplaintId() { return complaintId; }
    public void setComplaintId(String complaintId) { this.complaintId = complaintId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }
}
