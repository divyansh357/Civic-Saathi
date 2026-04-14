package com.civic.modules.worker.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Worker response DTO.
 */
public class WorkerResponse {
    @JsonProperty("id")
    private String id;

    @JsonProperty("userId")
    private String userId;

    @JsonProperty("departmentId")
    private String departmentId;

    @JsonProperty("designation")
    private String designation;

    @JsonProperty("status")
    private String status;

    @JsonProperty("complaintsAssigned")
    private Integer complaintsAssigned;

    @JsonProperty("complaintsResolved")
    private Integer complaintsResolved;

    public WorkerResponse() {
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getComplaintsAssigned() {
        return complaintsAssigned;
    }

    public void setComplaintsAssigned(Integer complaintsAssigned) {
        this.complaintsAssigned = complaintsAssigned;
    }

    public Integer getComplaintsResolved() {
        return complaintsResolved;
    }

    public void setComplaintsResolved(Integer complaintsResolved) {
        this.complaintsResolved = complaintsResolved;
    }
}
