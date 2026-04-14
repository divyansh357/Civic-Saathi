package com.civic.modules.auth.mapper;

import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.civic.modules.auth.dto.AuthResponse;
import com.civic.modules.auth.entity.AuthToken;

/**
 * Mapper for Auth-related entities and DTOs.
 */
@Component
public class AuthMapper {
    public AuthResponse toResponse(AuthToken token, String email) {
        AuthResponse response = new AuthResponse();
        response.setToken(token.getToken());
        response.setTokenType(token.getTokenType());
        response.setUserId(token.getUserId());
        response.setEmail(email);

        long ttlSeconds = Duration.between(LocalDateTime.now(), token.getExpiresAt()).getSeconds();
        response.setExpiresIn(Math.max(ttlSeconds, 0L));
        return response;
    }
}
