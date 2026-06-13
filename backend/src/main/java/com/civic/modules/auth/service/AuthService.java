package com.civic.modules.auth.service;

import com.civic.common.Constants;
import com.civic.modules.auth.dto.AuthResponse;
import com.civic.modules.auth.dto.AuthenticatedUserResponse;
import com.civic.modules.auth.dto.LoginRequest;
import com.civic.modules.auth.dto.SignupRequest;
import com.civic.modules.auth.entity.AuthToken;
import com.civic.modules.auth.entity.Role;
import com.civic.modules.auth.exception.InactiveUserException;
import com.civic.modules.auth.exception.InvalidCredentialsException;
import com.civic.modules.auth.exception.InvalidTokenException;
import com.civic.modules.auth.exception.ResourceConflictException;
import com.civic.modules.auth.mapper.AuthMapper;
import com.civic.modules.auth.repository.AuthTokenRepository;
import com.civic.modules.auth.repository.RoleRepository;
import com.civic.modules.user.entity.User;
import com.civic.modules.user.repository.UserRepository;
import com.civic.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.civic.modules.worker.entity.Worker;
import com.civic.modules.worker.repository.WorkerRepository;
import com.civic.modules.department.repository.DepartmentRepository;
import com.civic.modules.department.entity.Department;
import com.civic.modules.geography.repository.ZoneRepository;
import com.civic.modules.geography.entity.Zone;
import com.civic.modules.auth.dto.WorkerSignupRequest;
import java.util.stream.Collectors;
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
    private RoleRepository roleRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private ZoneRepository zoneRepository;

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
        String roleName = normalizeRole(request.getRole());

        // ADMIN and OFFICER must use a @municipal.in email address.
        // This acts as an implicit organisation-level verification gate.
        if ((roleName.equals("ADMIN") || roleName.equals("OFFICER"))
                && !normalizedEmail.endsWith("@municipal.in")) {
            throw new ResourceConflictException(
                "Admin and Officer accounts require an official @municipal.in email address");
        }

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
        // ADMIN/OFFICER are auto-verified via @municipal.in email rule
        user.setVerified(roleName.equals("ADMIN") || roleName.equals("OFFICER"));
        user.setStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setLastLoginAt(LocalDateTime.now());
        if (request.getZoneNumber() != null) user.setZoneNumber(request.getZoneNumber());
        if (request.getDepartmentCode() != null && !request.getDepartmentCode().isBlank()) {
            user.setDepartmentCode(request.getDepartmentCode().trim().toUpperCase());
        }

        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    Role newRole = new Role(roleName);
                    return roleRepository.save(newRole);
                });
        user.addRole(role);

        User savedUser = userRepository.save(user);
        return issueTokenPair(savedUser);
    }

    /**
     * Validate authentication token.
     */
    /**
     * Register a new worker user and issue auth tokens.
     */
    public AuthResponse signupWorker(WorkerSignupRequest request) {
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
        user.setVerified(false);
        user.setStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setLastLoginAt(LocalDateTime.now());

        Role role = roleRepository.findByName("WORKER")
                .orElseGet(() -> {
                    Role newRole = new Role("WORKER");
                    return roleRepository.save(newRole);
                });
        user.addRole(role);

        User savedUser = userRepository.save(user);

        Worker worker = new Worker();
        worker.setUser(savedUser);
        worker.setDesignation(request.getDesignation());
        worker.setAddress(request.getAddress());
        worker.setStatus("ACTIVE");
        worker.setComplaintsAssigned(0);
        worker.setComplaintsResolved(0);
        worker.setCreatedAt(LocalDateTime.now());
        worker.setUpdatedAt(LocalDateTime.now());

        if (request.getDepartmentCode() != null && !request.getDepartmentCode().isEmpty()) {
            Department dept = departmentRepository.findById(UUID.fromString(request.getDepartmentCode()))
                .orElseThrow(() -> new RuntimeException("Department not found"));
            worker.setDepartment(dept);
        } else {
            // Assign a default department if none provided, since DB requires it
            List<Department> departments = departmentRepository.findAll();
            if (!departments.isEmpty()) {
                worker.setDepartment(departments.get(0));
            } else {
                throw new RuntimeException("No departments available in the system");
            }
        }

        if (request.getPreferredZoneIds() != null && !request.getPreferredZoneIds().isEmpty()) {
            List<Zone> zones = request.getPreferredZoneIds().stream()
                .map(id -> zoneRepository.findById(UUID.fromString(id)).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            worker.setPreferredZones(new java.util.HashSet<>(zones));
        }

        workerRepository.save(worker);

        return issueTokenPair(savedUser);
    }

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
        // Derive role directly from the roles Set — avoids the deprecated getRole() which can return null.
        String primaryRole = authMapper.getPrimaryRole(user);
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), primaryRole);
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

