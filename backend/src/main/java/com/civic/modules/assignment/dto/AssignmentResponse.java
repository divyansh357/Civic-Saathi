package com.civic.modules.assignment.dto;

import java.time.LocalDateTime;

/**
 * DTO for assignment response.
 */
public class AssignmentResponse {

    private String id;
    private String complaintId;
    private String complaintTitle;
    private String departmentId;
    private String departmentName;
    private String assignedWorkerId;
    private String assignedWorkerName;
    private String assignmentType;
    private String status;
    private String priority;
    private LocalDateTime slaDeadline;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime completedAt;
    private boolean overdue;
    private Boolean isAutoAssigned;
    private java.util.List<String> completionImages;
    private Double complaintLatitude;
    private Double complaintLongitude;
    private String complaintAddress;
    private String complaintDescription;

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(String complaintId) {
        this.complaintId = complaintId;
    }

    public String getComplaintTitle() {
        return complaintTitle;
    }

    public void setComplaintTitle(String complaintTitle) {
        this.complaintTitle = complaintTitle;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getAssignedWorkerId() {
        return assignedWorkerId;
    }

    public void setAssignedWorkerId(String assignedWorkerId) {
        this.assignedWorkerId = assignedWorkerId;
    }

    public String getAssignedWorkerName() {
        return assignedWorkerName;
    }

    public void setAssignedWorkerName(String assignedWorkerName) {
        this.assignedWorkerName = assignedWorkerName;
    }

    public String getAssignmentType() {
        return assignmentType;
    }

    public void setAssignmentType(String assignmentType) {
        this.assignmentType = assignmentType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public LocalDateTime getSlaDeadline() {
        return slaDeadline;
    }

    public void setSlaDeadline(LocalDateTime slaDeadline) {
        this.slaDeadline = slaDeadline;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public boolean isOverdue() {
        return overdue;
    }

    public void setOverdue(boolean overdue) {
        this.overdue = overdue;
    }

    public Boolean getIsAutoAssigned() {
        return isAutoAssigned;
    }

    public void setIsAutoAssigned(Boolean isAutoAssigned) {
        this.isAutoAssigned = isAutoAssigned;
    }

    public java.util.List<String> getCompletionImages() {
        return completionImages;
    }

    public void setCompletionImages(java.util.List<String> completionImages) {
        this.completionImages = completionImages;
    }

    public Double getComplaintLatitude() { return complaintLatitude; }
    public void setComplaintLatitude(Double complaintLatitude) { this.complaintLatitude = complaintLatitude; }

    public Double getComplaintLongitude() { return complaintLongitude; }
    public void setComplaintLongitude(Double complaintLongitude) { this.complaintLongitude = complaintLongitude; }

    public String getComplaintAddress() { return complaintAddress; }
    public void setComplaintAddress(String complaintAddress) { this.complaintAddress = complaintAddress; }

    public String getComplaintDescription() { return complaintDescription; }
    public void setComplaintDescription(String complaintDescription) { this.complaintDescription = complaintDescription; }
}
