package com.civic.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Signup request DTO.
 */
public class SignupRequest {

    @NotBlank(message = "Name is required")
    @JsonProperty("name")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @JsonProperty("email")
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone must be 10–15 digits, optionally prefixed with country code")
    @JsonProperty("phone")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    @JsonProperty("password")
    private String password;

    @JsonProperty("cityId")
    private String cityId;

    @JsonProperty("role")
    private String role;

    /** Zone number the user belongs to. Must be a positive integer. */
    @Min(value = 1, message = "Zone number must be a positive integer")
    @JsonProperty("zoneNumber")
    private Integer zoneNumber;

    /**
     * Municipal code linking the user to a municipality.
     * Compulsory for profile creation.
     */
    @NotBlank(message = "Municipal code is required")
    @JsonProperty("municipalCode")
    private String municipalCode;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getCityId() { return cityId; }
    public void setCityId(String cityId) { this.cityId = cityId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Integer getZoneNumber() { return zoneNumber; }
    public void setZoneNumber(Integer zoneNumber) { this.zoneNumber = zoneNumber; }

    public String getMunicipalCode() { return municipalCode; }
    public void setMunicipalCode(String municipalCode) { this.municipalCode = municipalCode; }
}
