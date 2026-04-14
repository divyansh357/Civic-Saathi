package com.civic.modules.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * AI classification request DTO.
 */
public class ClassificationRequest {
    @JsonProperty("complaintText")
    private String complaintText;

    @JsonProperty("complaintId")
    private String complaintId;

    public ClassificationRequest() {
    }

    public String getComplaintText() {
        return complaintText;
    }

    public void setComplaintText(String complaintText) {
        this.complaintText = complaintText;
    }

    public String getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(String complaintId) {
        this.complaintId = complaintId;
    }
}
