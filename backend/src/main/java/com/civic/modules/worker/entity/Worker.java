package com.civic.modules.worker.entity;

import com.civic.modules.user.entity.User;
import com.civic.modules.department.entity.Department;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import com.civic.modules.geography.entity.Zone;

/**
 * Worker entity representing government field workers.
 * Uses native PostgreSQL uuid type for the primary key.
 */
@Entity
@Table(name = "workers")
public class Worker {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(nullable = false)
    private String designation;

    @Column(nullable = false)
    private String status; // ACTIVE, INACTIVE, ON_LEAVE

    private String specialization;

    private Double latitude;
    private Double longitude;

    @Column(name = "complaints_assigned", nullable = false)
    private Integer complaintsAssigned = 0;

    @Column(name = "complaints_resolved", nullable = false)
    private Integer complaintsResolved = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;

    @Column(name = "aadhar_no", length = 12)
    private String aadharNo;

    @Column(name = "is_aadhar_verified")
    private Boolean isAadharVerified = false;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "previous_works", columnDefinition = "TEXT")
    private String previousWorks; // Stored as JSON array string

    @Column(name = "worker_code", length = 50)
    private String workerCode;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "worker_preferred_zones",
        joinColumns = @JoinColumn(name = "worker_id"),
        inverseJoinColumns = @JoinColumn(name = "zone_id")
    )
    private Set<Zone> preferredZones = new HashSet<>();

    // Constructors
    public Worker() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() {
        return id != null ? id.toString() : null;
    }

    public void setId(String id) {
        this.id = id != null ? UUID.fromString(id) : null;
    }

    public UUID getUuid() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getUserId() {
        return user != null ? user.getId() : null;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public String getDepartmentId() {
        return department != null ? department.getId() : null;
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

    public String getAadharNo() {
        return aadharNo;
    }

    public void setAadharNo(String aadharNo) {
        this.aadharNo = aadharNo;
    }

    public Boolean getIsAadharVerified() {
        return isAadharVerified;
    }

    public void setIsAadharVerified(Boolean isAadharVerified) {
        this.isAadharVerified = isAadharVerified;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Set<Zone> getPreferredZones() {
        return preferredZones;
    }

    public void setPreferredZones(Set<Zone> preferredZones) {
        this.preferredZones = preferredZones;
    }

    public String getWorkerCode() {
        return workerCode;
    }

    public void setWorkerCode(String workerCode) {
        this.workerCode = workerCode;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getPreviousWorks() {
        return previousWorks;
    }

    public void setPreviousWorks(String previousWorks) {
        this.previousWorks = previousWorks;
    }

    public void addPreferredZone(Zone zone) {
        this.preferredZones.add(zone);
    }

    public void removePreferredZone(Zone zone) {
        this.preferredZones.remove(zone);
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
