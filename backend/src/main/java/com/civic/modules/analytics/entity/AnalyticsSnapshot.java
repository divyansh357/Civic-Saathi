package com.civic.modules.analytics.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * AnalyticsSnapshot entity for storing daily analytics snapshots.
 * Provides historical data for reporting and trend analysis.
 */
@Entity
@Table(name = "analytics_snapshots")
public class AnalyticsSnapshot {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column
    private LocalDate date;

    @Column(name = "total_complaints")
    private Integer totalComplaints;

    @Column(name = "resolved_count")
    private Integer resolvedCount;

    @Column(name = "pending_count")
    private Integer pendingCount;

    @Column(name = "avg_resolution_time")
    private Float avgResolutionTime;

    @Column(name = "top_category")
    private String topCategory;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Constructors
    public AnalyticsSnapshot() {
        this.createdAt = LocalDateTime.now();
    }

    public AnalyticsSnapshot(LocalDate date) {
        this();
        this.date = date;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Integer getTotalComplaints() {
        return totalComplaints;
    }

    public void setTotalComplaints(Integer totalComplaints) {
        this.totalComplaints = totalComplaints;
    }

    public Integer getResolvedCount() {
        return resolvedCount;
    }

    public void setResolvedCount(Integer resolvedCount) {
        this.resolvedCount = resolvedCount;
    }

    public Integer getPendingCount() {
        return pendingCount;
    }

    public void setPendingCount(Integer pendingCount) {
        this.pendingCount = pendingCount;
    }

    public Float getAvgResolutionTime() {
        return avgResolutionTime;
    }

    public void setAvgResolutionTime(Float avgResolutionTime) {
        this.avgResolutionTime = avgResolutionTime;
    }

    public String getTopCategory() {
        return topCategory;
    }

    public void setTopCategory(String topCategory) {
        this.topCategory = topCategory;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Utility methods
    public double getResolutionRate() {
        if (totalComplaints == null || totalComplaints == 0) {
            return 0.0;
        }
        return (resolvedCount != null ? resolvedCount : 0) * 100.0 / totalComplaints;
    }

    public double getPendingRate() {
        if (totalComplaints == null || totalComplaints == 0) {
            return 0.0;
        }
        return (pendingCount != null ? pendingCount : 0) * 100.0 / totalComplaints;
    }
}