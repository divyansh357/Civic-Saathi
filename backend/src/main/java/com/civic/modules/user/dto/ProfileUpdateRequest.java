package com.civic.modules.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating a user's own profile.
 * All fields are optional — only non-null values are applied.
 */
public class ProfileUpdateRequest {

    @JsonProperty("name")
    private String name;

    @JsonProperty("phone")
    private String phone;

    @JsonProperty("address")
    private String address;

    @Size(min = 12, max = 12, message = "Aadhar number must be exactly 12 digits")
    @JsonProperty("aadharNumber")
    private String aadharNumber;

    @Min(value = 1, message = "Zone number must be a positive integer")
    @JsonProperty("zoneNumber")
    private Integer zoneNumber;

    @JsonProperty("profilePictureUrl")
    private String profilePictureUrl;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAadharNumber() { return aadharNumber; }
    public void setAadharNumber(String aadharNumber) { this.aadharNumber = aadharNumber; }

    public Integer getZoneNumber() { return zoneNumber; }
    public void setZoneNumber(Integer zoneNumber) { this.zoneNumber = zoneNumber; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }
}
