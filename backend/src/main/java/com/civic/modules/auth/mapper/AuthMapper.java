package com.civic.modules.auth.mapper;

import com.civic.modules.auth.entity.Role;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.civic.modules.auth.dto.AuthResponse;
import com.civic.modules.auth.dto.AuthenticatedUserResponse;
import com.civic.modules.user.entity.User;

/**
 * Mapper for Auth-related entities and DTOs.
 */
@Component
public class AuthMapper {

    /**
     * Resolves the primary role name from the user's roles Set.
     * Prefers ADMIN > OFFICER > WORKER > CITIZEN to ensure the most privileged role wins.
     * Falls back to "CITIZEN" when the set is empty.
     */
    public String getPrimaryRole(User user) {
        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        if (roleNames.contains("ADMIN") || roleNames.contains("SUPERADMIN") || roleNames.contains("DEPARTMENT_ADMIN")) return "ADMIN";
        if (roleNames.contains("OFFICER")) return "OFFICER";
        if (roleNames.contains("WORKER")) return "WORKER";
        if (roleNames.contains("CITIZEN")) return "CITIZEN";
        return roleNames.isEmpty() ? "CITIZEN" : roleNames.get(0);
    }

    public AuthResponse toAuthResponse(String accessToken, String refreshToken, User user, long accessTokenTtlSeconds) {
        String role = getPrimaryRole(user);
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        if (roles.isEmpty()) roles = Collections.singletonList(role);

        AuthResponse response = new AuthResponse();
        response.setAccessToken(accessToken);
        response.setToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType("Bearer");
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setRole(role);
        response.setRoles(roles);
        response.setExpiresIn(Math.max(accessTokenTtlSeconds, 0L));
        return response;
    }

    public AuthenticatedUserResponse toAuthenticatedUser(User user) {
        String role = getPrimaryRole(user);
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        if (roles.isEmpty()) roles = Collections.singletonList(role);

        AuthenticatedUserResponse response = new AuthenticatedUserResponse();
        response.setUserId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(role);
        response.setRoles(roles);
        response.setVerified(user.isVerified());
        response.setActive(user.isActive());
        return response;
    }
}
