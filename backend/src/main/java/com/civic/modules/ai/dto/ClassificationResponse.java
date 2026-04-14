package com.civic.modules.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * AI classification response DTO.
 */
public class ClassificationResponse {
    @JsonProperty("complaintId")
    private String complaintId;

    @JsonProperty("category")
    private String category;

    @JsonProperty("confidence")
    private double confidence;

    @JsonProperty("suggestedDepartment")
    private String suggestedDepartment;

    @JsonProperty("urgencyLevel")
    private String urgencyLevel;

    public ClassificationResponse() {
    }

    // Getters and Setters
    public String getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(String complaintId) {
        this.complaintId = complaintId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public String getSuggestedDepartment() {
        return suggestedDepartment;
    }

    public void setSuggestedDepartment(String suggestedDepartment) {
        this.suggestedDepartment = suggestedDepartment;
    }

    public String getUrgencyLevel() {
        return urgencyLevel;
    }

    public void setUrgencyLevel(String urgencyLevel) {
        this.urgencyLevel = urgencyLevel;
    }
}
