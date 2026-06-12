package com.civic.modules.assignment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class AssignmentRejectRequest {
    
    @NotBlank(message = "Rejection reason is required")
    @JsonProperty("reason")
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
