package com.civic.modules.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * User profile response DTO.
 */
public class UserResponse {
    @JsonProperty("id")
    private String id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("email")
    private String email;

    @JsonProperty("phone")
    private String phone;

    @JsonProperty("role")
    private String role;

    @JsonProperty("city")
    private String city;

    @JsonProperty("profilePictureUrl")
    private String profilePictureUrl;

    @JsonProperty("address")
    private String address;

    @JsonProperty("aadharNumber")
    private String aadharNumber;

    @JsonProperty("zoneNumber")
    private Integer zoneNumber;

    @JsonProperty("verified")
    private boolean verified;

    @JsonProperty("status")
    private String status;

    /**
     * True when address and aadharNumber are both filled in.
     * Used by the mobile app and web dashboard to gate feature access.
     */
    @JsonProperty("profileComplete")
    private boolean profileComplete;

    public UserResponse() {
    }

    // Getters and Setters

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAadharNumber() { return aadharNumber; }
    public void setAadharNumber(String aadharNumber) { this.aadharNumber = aadharNumber; }

    public Integer getZoneNumber() { return zoneNumber; }
    public void setZoneNumber(Integer zoneNumber) { this.zoneNumber = zoneNumber; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isProfileComplete() { return profileComplete; }
    public void setProfileComplete(boolean profileComplete) { this.profileComplete = profileComplete; }
}
