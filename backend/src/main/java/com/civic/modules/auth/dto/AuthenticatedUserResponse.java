package com.civic.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Authenticated user profile response.
 */
public class AuthenticatedUserResponse {

    @JsonProperty("userId")
    private String userId;

    @JsonProperty("name")
    private String name;

    @JsonProperty("email")
    private String email;

    @JsonProperty("phone")
    private String phone;

    @JsonProperty("role")
    private String role;

    @JsonProperty("roles")
    private List<String> roles;

    @JsonProperty("verified")
    private boolean verified;

    @JsonProperty("active")
    private boolean active;

    @JsonProperty("address")
    private String address;

    @JsonProperty("aadharNumber")
    private String aadharNumber;

    @JsonProperty("zoneNumber")
    private Integer zoneNumber;

    @JsonProperty("profileComplete")
    private boolean profileComplete;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAadharNumber() { return aadharNumber; }
    public void setAadharNumber(String aadharNumber) { this.aadharNumber = aadharNumber; }

    public Integer getZoneNumber() { return zoneNumber; }
    public void setZoneNumber(Integer zoneNumber) { this.zoneNumber = zoneNumber; }

    public boolean isProfileComplete() { return profileComplete; }
    public void setProfileComplete(boolean profileComplete) { this.profileComplete = profileComplete; }
}