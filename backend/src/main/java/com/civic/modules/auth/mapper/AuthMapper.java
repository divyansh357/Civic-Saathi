package com.civic.modules.auth.mapper;

import java.util.Collections;

import org.springframework.stereotype.Component;

import com.civic.modules.auth.dto.AuthResponse;
import com.civic.modules.auth.dto.AuthenticatedUserResponse;
import com.civic.modules.user.entity.User;

/**
 * Mapper for Auth-related entities and DTOs.
 */
@Component
public class AuthMapper {
    public AuthResponse toAuthResponse(String accessToken, String refreshToken, User user, long accessTokenTtlSeconds) {
        AuthResponse response = new AuthResponse();
        response.setAccessToken(accessToken);
        response.setToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType("Bearer");
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setRoles(Collections.singletonList(user.getRole()));
        response.setExpiresIn(Math.max(accessTokenTtlSeconds, 0L));
        return response;
    }

    public AuthenticatedUserResponse toAuthenticatedUser(User user) {
        AuthenticatedUserResponse response = new AuthenticatedUserResponse();
        response.setUserId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole());
        response.setRoles(Collections.singletonList(user.getRole()));
        response.setVerified(user.isVerified());
        response.setActive(user.isActive());
        return response;
    }
}
