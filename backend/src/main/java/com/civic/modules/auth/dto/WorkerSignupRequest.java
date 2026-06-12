package com.civic.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class WorkerSignupRequest {

    @NotBlank(message = "Name is required")
    @JsonProperty("name")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @JsonProperty("email")
    private String email;

    @NotBlank(message = "Phone is required")
    @JsonProperty("phone")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @JsonProperty("password")
    private String password;

    @JsonProperty("departmentCode")
    private String departmentCode;

    @NotBlank(message = "Designation is required")
    @JsonProperty("designation")
    private String designation;

    @JsonProperty("address")
    private String address;

    @JsonProperty("preferredZoneIds")
    private List<String> preferredZoneIds;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public List<String> getPreferredZoneIds() { return preferredZoneIds; }
    public void setPreferredZoneIds(List<String> preferredZoneIds) { this.preferredZoneIds = preferredZoneIds; }
}
