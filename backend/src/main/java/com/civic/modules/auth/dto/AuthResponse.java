package com.civic.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Auth response DTO containing token and user info.
 */
public class AuthResponse {
    @JsonProperty("token")
    private String token;

    @JsonProperty("tokenType")
    private String tokenType;

    @JsonProperty("userId")
    private String userId;

    @JsonProperty("email")
    private String email;

    @JsonProperty("expiresIn")
    private Long expiresIn;

    public AuthResponse() {
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(Long expiresIn) {
        this.expiresIn = expiresIn;
    }
}
