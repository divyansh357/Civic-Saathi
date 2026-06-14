package com.civic.modules.worker.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Worker response DTO.
 */
public class WorkerResponse {
    @JsonProperty("id")
    private String id;

    @JsonProperty("userId")
    private String userId;

    @JsonProperty("name")
    private String name;

    @JsonProperty("email")
    private String email;

    @JsonProperty("departmentId")
    private String departmentId;

    @JsonProperty("departmentName")
    private String departmentName;

    @JsonProperty("designation")
    private String designation;

    @JsonProperty("status")
    private String status;

    @JsonProperty("complaintsAssigned")
    private Integer complaintsAssigned;

    @JsonProperty("complaintsResolved")
    private Integer complaintsResolved;

    @JsonProperty("aadharNo")
    private String aadharNo;

    @JsonProperty("isAadharVerified")
    private Boolean isAadharVerified;

    @JsonProperty("address")
    private String address;

    @JsonProperty("preferredZoneIds")
    private List<String> preferredZoneIds;

    @JsonProperty("profileImageUrl")
    private String profileImageUrl;

    @JsonProperty("previousWorks")
    private String previousWorks;

    @JsonProperty("workerCode")
    private String workerCode;

    @JsonProperty("latitude")
    private Double latitude;

    @JsonProperty("longitude")
    private Double longitude;

    @JsonProperty("lastActiveAt")
    private String lastActiveAt;

    public WorkerResponse() {
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getComplaintsAssigned() { return complaintsAssigned; }
    public void setComplaintsAssigned(Integer complaintsAssigned) { this.complaintsAssigned = complaintsAssigned; }
    public Integer getComplaintsResolved() { return complaintsResolved; }
    public void setComplaintsResolved(Integer complaintsResolved) { this.complaintsResolved = complaintsResolved; }
    public String getAadharNo() { return aadharNo; }
    public void setAadharNo(String aadharNo) { this.aadharNo = aadharNo; }
    public Boolean getIsAadharVerified() { return isAadharVerified; }
    public void setIsAadharVerified(Boolean isAadharVerified) { this.isAadharVerified = isAadharVerified; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public List<String> getPreferredZoneIds() { return preferredZoneIds; }
    public void setPreferredZoneIds(List<String> preferredZoneIds) { this.preferredZoneIds = preferredZoneIds; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    public String getPreviousWorks() { return previousWorks; }
    public void setPreviousWorks(String previousWorks) { this.previousWorks = previousWorks; }
    public String getWorkerCode() { return workerCode; }
    public void setWorkerCode(String workerCode) { this.workerCode = workerCode; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(String lastActiveAt) { this.lastActiveAt = lastActiveAt; }
}
