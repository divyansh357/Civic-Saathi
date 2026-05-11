package com.civic.modules.complaint.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ComplaintDuplicate entity for tracking duplicate complaint relationships.
 * Links complaints that are identified as duplicates of existing complaints.
 */
@Entity
@Table(name = "complaint_duplicates",
       uniqueConstraints = @UniqueConstraint(columnNames = {"complaint_id", "duplicate_of"}))
public class ComplaintDuplicate {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "duplicate_of", nullable = false)
    private Complaint duplicateOf;

    @Column(name = "similarity_score")
    private Float similarityScore;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Constructors
    public ComplaintDuplicate() {
        this.createdAt = LocalDateTime.now();
    }

    public ComplaintDuplicate(Complaint complaint, Complaint duplicateOf, Float similarityScore) {
        this();
        this.complaint = complaint;
        this.duplicateOf = duplicateOf;
        this.similarityScore = similarityScore;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Complaint getComplaint() {
        return complaint;
    }

    public void setComplaint(Complaint complaint) {
        this.complaint = complaint;
    }

    public Complaint getDuplicateOf() {
        return duplicateOf;
    }

    public void setDuplicateOf(Complaint duplicateOf) {
        this.duplicateOf = duplicateOf;
    }

    public Float getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(Float similarityScore) {
        this.similarityScore = similarityScore;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}