package com.civic.modules.complaint.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for updating complaint status and adding updates.
 */
public class UpdateComplaintStatusRequest {

    @JsonProperty("status")
    private String status;

    @JsonProperty("resolution")
    private String resolution;

    @JsonProperty("assignedWorkerId")
    private String assignedWorkerId;

    // Constructors
    public UpdateComplaintStatusRequest() {
    }

    public UpdateComplaintStatusRequest(String status) {
        this.status = status;
    }

    // Getters and Setters
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public String getAssignedWorkerId() {
        return assignedWorkerId;
    }

    public void setAssignedWorkerId(String assignedWorkerId) {
        this.assignedWorkerId = assignedWorkerId;
    }
}
