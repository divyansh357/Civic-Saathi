package com.civic.modules.feedback.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class FeedbackRequest {

    @NotNull
    private String complaintId;

    @NotNull
    @Min(1) @Max(5)
    private Integer rating;

    private String comment;

    private Boolean isSatisfied;

    public String getComplaintId() { return complaintId; }
    public void setComplaintId(String complaintId) { this.complaintId = complaintId; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Boolean getIsSatisfied() { return isSatisfied; }
    public void setIsSatisfied(Boolean isSatisfied) { this.isSatisfied = isSatisfied; }
}
