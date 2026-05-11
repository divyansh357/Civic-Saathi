package com.civic.modules.feedback.dto;

import java.time.LocalDateTime;

public class FeedbackResponse {
    private String id;
    private String complaintId;
    private String userId;
    private String userName;
    private Integer rating;
    private String comment;
    private Boolean isSatisfied;
    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getComplaintId() { return complaintId; }
    public void setComplaintId(String complaintId) { this.complaintId = complaintId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Boolean getIsSatisfied() { return isSatisfied; }
    public void setIsSatisfied(Boolean isSatisfied) { this.isSatisfied = isSatisfied; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
