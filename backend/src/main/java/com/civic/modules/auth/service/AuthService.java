package com.civic.modules.auth.service;

import com.civic.common.Constants;
import com.civic.modules.auth.dto.AuthResponse;
import com.civic.modules.auth.dto.AuthenticatedUserResponse;
import com.civic.modules.auth.dto.LoginRequest;
import com.civic.modules.auth.dto.SignupRequest;
import com.civic.modules.auth.entity.AuthToken;
import com.civic.modules.auth.exception.InactiveUserException;
import com.civic.modules.auth.exception.InvalidCredentialsException;
import com.civic.modules.auth.exception.InvalidTokenException;
import com.civic.modules.auth.exception.ResourceConflictException;
import com.civic.modules.auth.mapper.AuthMapper;
import com.civic.modules.auth.repository.AuthTokenRepository;
import com.civic.modules.user.entity.User;
import com.civic.modules.user.repository.UserRepository;
import com.civic.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for authentication operations.
 */
@Service
@Transactional
public class AuthService {

    private static final String REFRESH_TOKEN_TYPE = "REFRESH";

    @Autowired
    private AuthTokenRepository authTokenRepository;

    @Autowired
    private AuthMapper authMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Authenticate user and generate token.
     */
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!user.isActive()) {
            throw new InactiveUserException("User account is inactive");
        }

        if (!passwordMatches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        revokeActiveRefreshTokens(user.getId());
        return issueTokenPair(user);
    }

    /**
     * Register a new user and issue auth tokens.
     */
    public AuthResponse signup(SignupRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedPhone = normalizePhone(request.getPhone());

        userRepository.findByEmailIgnoreCase(normalizedEmail)
                .ifPresent(existing -> {
                    throw new ResourceConflictException("Email is already registered");
                });

        userRepository.findByPhone(normalizedPhone)
                .ifPresent(existing -> {
                    throw new ResourceConflictException("Phone is already registered");
                });

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPhone(normalizedPhone);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(normalizeRole(request.getRole()));
        user.setVerified(false);
        user.setStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setLastLoginAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        return issueTokenPair(savedUser);
    }

    /**
     * Validate authentication token.
     */
    public boolean validateToken(String token) {
        String resolvedToken = resolveToken(token);
        return !resolvedToken.isBlank() && jwtTokenProvider.validateToken(resolvedToken);
    }

    /**
     * Revoke authentication token.
     */
    public void revokeToken(String refreshToken) {
        String resolvedToken = resolveToken(refreshToken);
        authTokenRepository.findByTokenAndActiveTrue(resolvedToken)
                .ifPresent(this::revokeStoredToken);
    }

    /**
     * Refresh authentication token.
     */
    public AuthResponse refreshToken(String refreshToken) {
        String resolvedRefreshToken = resolveToken(refreshToken);

        if (!jwtTokenProvider.validateToken(resolvedRefreshToken)) {
            throw new InvalidTokenException("Refresh token is invalid or expired");
        }

        AuthToken storedToken = authTokenRepository.findByTokenAndActiveTrue(resolvedRefreshToken)
                .orElseThrow(() -> new InvalidTokenException("Refresh token is invalid or revoked"));

        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            revokeStoredToken(storedToken);
            throw new InvalidTokenException("Refresh token has expired");
        }

        String tokenUserId = jwtTokenProvider.getUserIdFromToken(resolvedRefreshToken);
        if (!storedToken.getUserId().equals(tokenUserId)) {
            revokeStoredToken(storedToken);
            throw new InvalidTokenException("Refresh token user mismatch");
        }

        String refreshedUserId = requiredUserId(storedToken.getUserId());

        User user = userRepository.findById(UUID.fromString(Objects.requireNonNull(refreshedUserId)))
            .orElseThrow(() -> new InactiveUserException("User account is inactive"));

        if (!user.isActive()) {
            throw new InactiveUserException("User account is inactive");
        }

        revokeStoredToken(storedToken);
        return issueTokenPair(user);
    }

    /**
     * Resolve authenticated user from access token.
     */
    @Transactional(readOnly = true)
    public AuthenticatedUserResponse getCurrentUser(String authorizationHeader) {
        String token = resolveToken(authorizationHeader);
        if (token.isBlank() || !jwtTokenProvider.validateToken(token)) {
            throw new InvalidTokenException("Access token is invalid or expired");
        }

        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return getCurrentUserById(userId);
    }

    /**
     * Resolve authenticated user from principal user ID.
     */
    @Transactional(readOnly = true)
    public AuthenticatedUserResponse getCurrentUserById(String userId) {
        String requiredUserId = requiredUserId(userId);

        User user = userRepository.findById(UUID.fromString(Objects.requireNonNull(requiredUserId)))
                .orElseThrow(() -> new InactiveUserException("User account is inactive"));

        if (!user.isActive()) {
            throw new InactiveUserException("User account is inactive");
        }

        return authMapper.toAuthenticatedUser(user);
    }

    private AuthResponse issueTokenPair(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        AuthToken tokenRecord = new AuthToken();
        tokenRecord.setUser(user);
        tokenRecord.setToken(refreshToken);
        tokenRecord.setTokenType(REFRESH_TOKEN_TYPE);
        tokenRecord.setCreatedAt(LocalDateTime.now());
        tokenRecord.setExpiresAt(jwtTokenProvider.getRefreshTokenExpiresAt());
        tokenRecord.setActive(true);

        authTokenRepository.save(tokenRecord);

        return authMapper.toAuthResponse(
                accessToken,
                refreshToken,
                user,
                jwtTokenProvider.getAccessTokenExpirySeconds());
    }

    private void revokeActiveRefreshTokens(String userId) {
        List<AuthToken> activeRefreshTokens = authTokenRepository
                .findAllByUserIdAndTokenTypeAndActiveTrue(UUID.fromString(userId), REFRESH_TOKEN_TYPE);

        for (AuthToken activeToken : activeRefreshTokens) {
            revokeStoredToken(activeToken);
        }
    }

    private void revokeStoredToken(AuthToken token) {
        token.setActive(false);
        token.setRevokedAt(LocalDateTime.now());
        authTokenRepository.save(token);
    }

    private String resolveToken(String tokenOrHeader) {
        if (tokenOrHeader == null) {
            return "";
        }

        String trimmed = tokenOrHeader.trim();
        if (trimmed.regionMatches(true, 0, Constants.JWT_TOKEN_PREFIX, 0, Constants.JWT_TOKEN_PREFIX.length())) {
            return trimmed.substring(Constants.JWT_TOKEN_PREFIX.length()).trim();
        }
        return trimmed;
    }

    private String normalizeEmail(String email) {
        return Optional.ofNullable(email)
                .map(String::trim)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .orElse("");
    }

    private String normalizePhone(String phone) {
        return Optional.ofNullable(phone)
                .map(String::trim)
                .orElse("");
    }

    private String normalizeRole(String role) {
        String normalized = Optional.ofNullable(role)
                .map(String::trim)
                .map(value -> value.toUpperCase(Locale.ROOT))
                .orElse("CITIZEN");

        return switch (normalized) {
            case "WORKER", "OFFICER", "ADMIN", "DEPARTMENT_ADMIN", "SUPERADMIN", "CITIZEN" -> normalized;
            default -> "CITIZEN";
        };
    }

    private String requiredUserId(String userId) {
        String value = Objects.requireNonNull(userId, "User ID is required").trim();
        if (value.isEmpty()) {
            throw new InvalidTokenException("User ID is missing in token");
        }
        return value;
    }

    private boolean passwordMatches(String rawPassword, String storedPasswordHash) {
        if (rawPassword == null || storedPasswordHash == null) {
            return false;
        }

        try {
            if (passwordEncoder.matches(rawPassword, storedPasswordHash)) {
                return true;
            }
        } catch (IllegalArgumentException ignored) {
            // Fallback for legacy plain-text test/dev data.
        }

        return rawPassword.equals(storedPasswordHash);
    }
}
