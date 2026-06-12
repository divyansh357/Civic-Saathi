package com.civic.modules.complaint.entity;

import com.civic.modules.user.entity.User;
import com.civic.modules.department.entity.Department;
import com.civic.modules.worker.entity.Worker;
import com.civic.modules.geography.entity.City;
import com.civic.modules.geography.entity.Ward;
import com.civic.modules.geography.entity.Zone;
import com.civic.modules.category.entity.Category;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;
import java.util.UUID;

/**
 * Complaint entity representing a citizen's complaint against a civic issue.
 * Updated to match the full database schema with PostGIS location, multi-category support, and AI features.
 */
@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "complaint_number", nullable = false, unique = true)
    private String complaintNumber;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintStatus status = ComplaintStatus.SUBMITTED;

    @Column
    private String priority;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_worker_id")
    private Worker assignedWorker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id")
    private Zone zone;

    // PostGIS location field
    @Column(name = "location", columnDefinition = "geography(Point, 4326)")
    private Point location;

    @Column(name = "address_text")
    private String addressText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintVisibility visibility = ComplaintVisibility.PRIVATE;

    @Column(name = "trust_score")
    private Double trustScore = 0.0;

    @Column(name = "is_duplicate", nullable = false)
    private Boolean isDuplicate = false;

    // AI-related fields
    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "ai_priority_score")
    private Float aiPriorityScore;

    @Column(name = "verification_method")
    private String verificationMethod; // "AI", "MANUAL", "PENDING"

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "complaint_images", joinColumns = @JoinColumn(name = "complaint_id"))
    @Column(name = "image_url")
    private java.util.List<String> imageUrls = new java.util.ArrayList<>();

    // Standard lat/lng fallback for when PostGIS isn't used or easily parsed
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(columnDefinition = "TEXT")
    private String embedding;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "sla_deadline")
    private LocalDateTime slaDeadline;

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    // Multi-category relationship
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "complaint_category_map",
        joinColumns = @JoinColumn(name = "complaint_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private Set<Category> categories = new HashSet<>();

    // Enums
    public enum ComplaintStatus {
        OPEN, SUBMITTED, DUPLICATE_CHECKED, VERIFIED, ROUTED, ASSIGNED, 
        ACKNOWLEDGED, IN_PROGRESS, RESOLVED, VERIFIED_FOR_CLOSURE, 
        CLOSED, REOPENED, REJECTED, CANCELLED, ESCALATED
    }

    public enum ComplaintVisibility {
        PRIVATE, PUBLIC
    }

    // Constructors
    public Complaint() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Complaint(String title, String description, User createdBy, City city) {
        this();
        this.title = title;
        this.description = description;
        this.createdBy = createdBy;
        this.city = city;
        this.status = ComplaintStatus.SUBMITTED;
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    // Backward compatibility method
    @Deprecated
    public String getIdAsString() {
        return id != null ? id.toString() : null;
    }

    @Deprecated
    public void setId(String id) {
        this.id = id != null ? UUID.fromString(id) : null;
    }

    public String getComplaintNumber() {
        return complaintNumber;
    }

    public void setComplaintNumber(String complaintNumber) {
        this.complaintNumber = complaintNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }

    // Backward compatibility method
    @Deprecated
    public String getStatusAsString() {
        return status != null ? status.name() : null;
    }

    @Deprecated
    public void setStatus(String status) {
        this.status = status != null ? ComplaintStatus.valueOf(status.toUpperCase()) : null;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    // Backward compatibility methods
    @Deprecated
    public User getUser() {
        return createdBy;
    }

    @Deprecated
    public void setUser(User user) {
        this.createdBy = user;
    }

    @Deprecated
    public String getUserId() {
        return createdBy != null ? createdBy.getId() : null;
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

    public Worker getAssignedWorker() {
        return assignedWorker;
    }

    public void setAssignedWorker(Worker assignedWorker) {
        this.assignedWorker = assignedWorker;
    }

    public String getAssignedWorkerId() {
        return assignedWorker != null ? assignedWorker.getId() : null;
    }

    public City getCity() {
        return city;
    }

    public void setCity(City city) {
        this.city = city;
    }

    public Ward getWard() {
        return ward;
    }

    public void setWard(Ward ward) {
        this.ward = ward;
    }

    public Zone getZone() {
        return zone;
    }

    public void setZone(Zone zone) {
        this.zone = zone;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }

    // Backward compatibility methods for lat/lng
    @Deprecated
    public Double getLatitude() {
        return latitude != null ? latitude : (location != null ? location.getY() : null);
    }

    @Deprecated
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    @Deprecated
    public Double getLongitude() {
        return longitude != null ? longitude : (location != null ? location.getX() : null);
    }

    @Deprecated
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public java.util.List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(java.util.List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public String getVerificationMethod() {
        return verificationMethod;
    }

    public void setVerificationMethod(String verificationMethod) {
        this.verificationMethod = verificationMethod;
    }

    public String getAddressText() {
        return addressText;
    }

    public void setAddressText(String addressText) {
        this.addressText = addressText;
    }

    public ComplaintVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(ComplaintVisibility visibility) {
        this.visibility = visibility;
    }

    public Double getTrustScore() {
        return trustScore;
    }

    public void setTrustScore(Double trustScore) {
        this.trustScore = trustScore;
    }

    public Boolean getIsDuplicate() {
        return isDuplicate;
    }

    public void setIsDuplicate(Boolean isDuplicate) {
        this.isDuplicate = isDuplicate;
    }

    public String getAiSummary() {
        return aiSummary;
    }

    public void setAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }

    public Float getAiPriorityScore() {
        return aiPriorityScore;
    }

    public void setAiPriorityScore(Float aiPriorityScore) {
        this.aiPriorityScore = aiPriorityScore;
    }

    public String getEmbedding() {
        return embedding;
    }

    public void setEmbedding(String embedding) {
        this.embedding = embedding;
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

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public LocalDateTime getSlaDeadline() {
        return slaDeadline;
    }

    public void setSlaDeadline(LocalDateTime slaDeadline) {
        this.slaDeadline = slaDeadline;
    }

    public LocalDateTime getEscalatedAt() {
        return escalatedAt;
    }

    public void setEscalatedAt(LocalDateTime escalatedAt) {
        this.escalatedAt = escalatedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }

    public boolean isSlaBreached() {
        return slaDeadline != null && LocalDateTime.now().isAfter(slaDeadline)
            && status != ComplaintStatus.RESOLVED && status != ComplaintStatus.CLOSED;
    }

    public Set<Category> getCategories() {
        return categories;
    }

    public void setCategories(Set<Category> categories) {
        this.categories = categories;
    }

    // Backward compatibility method for single category
    @Deprecated
    public String getCategory() {
        return categories.isEmpty() ? null : categories.iterator().next().getName();
    }

    @Deprecated
    public void setCategory(String category) {
        // This would need category lookup to work properly
        // For now, just store as transient field
    }

    // Utility methods
    public void addCategory(Category category) {
        this.categories.add(category);
    }

    public void removeCategory(Category category) {
        this.categories.remove(category);
    }

    public boolean hasCategory(String categoryName) {
        return categories.stream().anyMatch(cat -> cat.getName().equals(categoryName));
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
        if (this.complaintNumber == null) {
            this.complaintNumber = "CMP-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}