package com.civic.modules.worker.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public class WorkerProfileUpdateRequest {
    @JsonProperty("profileImageUrl")
    private String profileImageUrl;

    @JsonProperty("previousWorks")
    private String previousWorks;

    @JsonProperty("address")
    private String address;

    @Pattern(regexp = "\\d{12}", message = "Aadhar number must contain exactly 12 numeric digits")
    @JsonProperty("aadharNo")
    private String aadharNo;

    @JsonProperty("workerCode")
    private String workerCode;

    @JsonProperty("preferredZoneIds")
    private List<String> preferredZoneIds;

    // Getters and Setters
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public String getPreviousWorks() { return previousWorks; }
    public void setPreviousWorks(String previousWorks) { this.previousWorks = previousWorks; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAadharNo() { return aadharNo; }
    public void setAadharNo(String aadharNo) { this.aadharNo = aadharNo; }

    public String getWorkerCode() { return workerCode; }
    public void setWorkerCode(String workerCode) { this.workerCode = workerCode; }

    public List<String> getPreferredZoneIds() { return preferredZoneIds; }
    public void setPreferredZoneIds(List<String> preferredZoneIds) { this.preferredZoneIds = preferredZoneIds; }
}
