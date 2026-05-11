package com.civic.modules.analytics.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

/**
 * Analytics dashboard DTO — full Level B response.
 */
public class AnalyticsDashboardResponse {

    @JsonProperty("totalComplaints")
    private long totalComplaints;

    @JsonProperty("openComplaints")
    private long openComplaints;

    @JsonProperty("resolvedComplaints")
    private long resolvedComplaints;

    @JsonProperty("escalatedComplaints")
    private long escalatedComplaints;

    @JsonProperty("averageResolutionTime")
    private double averageResolutionTime;

    @JsonProperty("slaBreachRate")
    private double slaBreachRate;

    @JsonProperty("departments")
    private long departments;

    @JsonProperty("workers")
    private long workers;

    @JsonProperty("citySatisfactionScore")
    private double citySatisfactionScore;

    @JsonProperty("complaintsByStatus")
    private Map<String, Long> complaintsByStatus;

    @JsonProperty("complaintsByDepartment")
    private Map<String, Long> complaintsByDepartment;

    @JsonProperty("aiInsights")
    private String aiInsights;

    public AnalyticsDashboardResponse() {}

    // Getters and Setters
    public long getTotalComplaints() { return totalComplaints; }
    public void setTotalComplaints(long totalComplaints) { this.totalComplaints = totalComplaints; }

    public long getOpenComplaints() { return openComplaints; }
    public void setOpenComplaints(long openComplaints) { this.openComplaints = openComplaints; }

    public long getResolvedComplaints() { return resolvedComplaints; }
    public void setResolvedComplaints(long resolvedComplaints) { this.resolvedComplaints = resolvedComplaints; }

    public long getEscalatedComplaints() { return escalatedComplaints; }
    public void setEscalatedComplaints(long escalatedComplaints) { this.escalatedComplaints = escalatedComplaints; }

    public double getAverageResolutionTime() { return averageResolutionTime; }
    public void setAverageResolutionTime(double averageResolutionTime) { this.averageResolutionTime = averageResolutionTime; }

    public double getSlaBreachRate() { return slaBreachRate; }
    public void setSlaBreachRate(double slaBreachRate) { this.slaBreachRate = slaBreachRate; }

    public long getDepartments() { return departments; }
    public void setDepartments(long departments) { this.departments = departments; }

    public long getWorkers() { return workers; }
    public void setWorkers(long workers) { this.workers = workers; }

    public double getCitySatisfactionScore() { return citySatisfactionScore; }
    public void setCitySatisfactionScore(double citySatisfactionScore) { this.citySatisfactionScore = citySatisfactionScore; }

    public Map<String, Long> getComplaintsByStatus() { return complaintsByStatus; }
    public void setComplaintsByStatus(Map<String, Long> complaintsByStatus) { this.complaintsByStatus = complaintsByStatus; }

    public Map<String, Long> getComplaintsByDepartment() { return complaintsByDepartment; }
    public void setComplaintsByDepartment(Map<String, Long> complaintsByDepartment) { this.complaintsByDepartment = complaintsByDepartment; }

    public String getAiInsights() { return aiInsights; }
    public void setAiInsights(String aiInsights) { this.aiInsights = aiInsights; }
}
