package com.civic.modules.worker.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Worker entity representing government field workers.
 */
@Entity
@Table(name = "workers")
public class Worker {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String departmentId;

    @Column(nullable = false)
    private String designation;

    @Column(nullable = false)
    private String status; // ACTIVE, INACTIVE, ON_LEAVE

    @Column
    private String specialization;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column
    private Integer complaintsAssigned = 0;

    @Column
    private Integer complaintsResolved = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime lastActiveAt;

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

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
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

    public LocalDateTime getLastActiveAt() {
        return lastActiveAt;
    }

    public void setLastActiveAt(LocalDateTime lastActiveAt) {
        this.lastActiveAt = lastActiveAt;
    }
}
