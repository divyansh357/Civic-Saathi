package com.civic.modules.auth.service;

import com.civic.modules.auth.dto.AuthResponse;
import com.civic.modules.auth.dto.LoginRequest;
import com.civic.modules.auth.dto.SignupRequest;
import com.civic.modules.auth.entity.AuthToken;
import com.civic.modules.auth.exception.InvalidCredentialsException;
import com.civic.modules.auth.exception.ResourceConflictException;
import com.civic.modules.auth.mapper.AuthMapper;
import com.civic.modules.auth.repository.AuthTokenRepository;
import com.civic.modules.user.entity.User;
import com.civic.modules.user.repository.UserRepository;
import com.civic.security.JwtTokenProvider;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthTokenRepository authTokenRepository;

    @Mock
    private AuthMapper authMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    @SuppressWarnings("null")
    void loginShouldReturnTokensForValidCredentials() {
        LoginRequest request = new LoginRequest();
        request.setEmail("citizen@civic.com");
        request.setPassword("password");

        User user = buildUser("user-1", "citizen@civic.com", "encoded-password", "CITIZEN", true);
        String userId = user.getId(); // Get the actual UUID string

        AuthResponse expected = new AuthResponse();
        expected.setAccessToken("access-token");
        expected.setRefreshToken("refresh-token");

        when(userRepository.findByEmailIgnoreCase("citizen@civic.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "encoded-password")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(authTokenRepository.findAllByUserIdAndTokenTypeAndActiveTrue(UUID.fromString(userId), "REFRESH"))
                .thenReturn(Collections.emptyList());
        when(jwtTokenProvider.generateAccessToken(userId, "citizen@civic.com", "CITIZEN"))
                .thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(userId)).thenReturn("refresh-token");
        when(jwtTokenProvider.getRefreshTokenExpiresAt()).thenReturn(LocalDateTime.now().plusDays(7));
        when(jwtTokenProvider.getAccessTokenExpirySeconds()).thenReturn(900L);
        when(authTokenRepository.save(any(AuthToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(authMapper.toAuthResponse("access-token", "refresh-token", user, 900L)).thenReturn(expected);

        AuthResponse actual = authService.login(request);

        Assertions.assertEquals("access-token", actual.getAccessToken());
        Assertions.assertEquals("refresh-token", actual.getRefreshToken());
        verify(authTokenRepository, times(1)).save(any(AuthToken.class));
    }

    @Test
    void loginShouldThrowWhenPasswordInvalid() {
        LoginRequest request = new LoginRequest();
        request.setEmail("citizen@civic.com");
        request.setPassword("wrong-password");

        User user = buildUser("user-1", "citizen@civic.com", "encoded-password", "CITIZEN", true);

        when(userRepository.findByEmailIgnoreCase("citizen@civic.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

        Assertions.assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @SuppressWarnings("null")
    void signupShouldCreateUserAndIssueTokens() {
        SignupRequest request = new SignupRequest();
        request.setName("Citizen User");
        request.setEmail("citizen@civic.com");
        request.setPhone("9999999999");
        request.setPassword("password123");
        request.setRole("citizen");

        User savedUser = buildUser("user-2", "citizen@civic.com", "encoded-password", "CITIZEN", true);
        String userId = savedUser.getId(); // Get the actual UUID string

        AuthResponse expected = new AuthResponse();
        expected.setAccessToken("access-token");
        expected.setRefreshToken("refresh-token");

        when(userRepository.findByEmailIgnoreCase("citizen@civic.com")).thenReturn(Optional.empty());
        when(userRepository.findByPhone("9999999999")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtTokenProvider.generateAccessToken(userId, "citizen@civic.com", "CITIZEN"))
                .thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(userId)).thenReturn("refresh-token");
        when(jwtTokenProvider.getRefreshTokenExpiresAt()).thenReturn(LocalDateTime.now().plusDays(7));
        when(jwtTokenProvider.getAccessTokenExpirySeconds()).thenReturn(900L);
        when(authMapper.toAuthResponse("access-token", "refresh-token", savedUser, 900L)).thenReturn(expected);
        when(authTokenRepository.save(any(AuthToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse actual = authService.signup(request);

        Assertions.assertEquals("access-token", actual.getAccessToken());
        Assertions.assertEquals("refresh-token", actual.getRefreshToken());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void signupShouldFailWhenEmailAlreadyExists() {
        SignupRequest request = new SignupRequest();
        request.setName("Citizen User");
        request.setEmail("citizen@civic.com");
        request.setPhone("9999999999");
        request.setPassword("password123");

        User existing = buildUser("existing-user", "citizen@civic.com", "encoded", "CITIZEN", true);
        when(userRepository.findByEmailIgnoreCase("citizen@civic.com")).thenReturn(Optional.of(existing));

        Assertions.assertThrows(ResourceConflictException.class, () -> authService.signup(request));
    }

    @Test
    void signupShouldFailWhenPhoneAlreadyExists() {
        SignupRequest request = new SignupRequest();
        request.setName("Citizen User");
        request.setEmail("citizen@civic.com");
        request.setPhone("9999999999");
        request.setPassword("password123");

        User existing = buildUser("existing-user", "existing@civic.com", "encoded", "CITIZEN", true);
        when(userRepository.findByEmailIgnoreCase("citizen@civic.com")).thenReturn(Optional.empty());
        when(userRepository.findByPhone("9999999999")).thenReturn(Optional.of(existing));

        Assertions.assertThrows(ResourceConflictException.class, () -> authService.signup(request));
    }

    @Test
    @SuppressWarnings("null")
    void refreshTokenShouldRotateToken() {
        User user = buildUser("user-1", "citizen@civic.com", "encoded-password", "CITIZEN", true);
        String userId = user.getId(); // Get the actual UUID string

        AuthToken storedRefreshToken = new AuthToken();
        storedRefreshToken.setUser(user);
        storedRefreshToken.setToken("refresh-token-old");
        storedRefreshToken.setTokenType("REFRESH");
        storedRefreshToken.setExpiresAt(LocalDateTime.now().plusDays(2));
        storedRefreshToken.setActive(true);

        AuthResponse expected = new AuthResponse();
        expected.setAccessToken("access-token-new");
        expected.setRefreshToken("refresh-token-new");

        when(jwtTokenProvider.validateToken("refresh-token-old")).thenReturn(true);
        when(authTokenRepository.findByTokenAndActiveTrue("refresh-token-old"))
                .thenReturn(Optional.of(storedRefreshToken));
        when(jwtTokenProvider.getUserIdFromToken("refresh-token-old")).thenReturn(userId);
        when(userRepository.findById(UUID.fromString(userId))).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateAccessToken(userId, "citizen@civic.com", "CITIZEN"))
                .thenReturn("access-token-new");
        when(jwtTokenProvider.generateRefreshToken(userId)).thenReturn("refresh-token-new");
        when(jwtTokenProvider.getRefreshTokenExpiresAt()).thenReturn(LocalDateTime.now().plusDays(7));
        when(jwtTokenProvider.getAccessTokenExpirySeconds()).thenReturn(900L);
        when(authTokenRepository.save(any(AuthToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(authMapper.toAuthResponse(eq("access-token-new"), eq("refresh-token-new"), eq(user), eq(900L)))
                .thenReturn(expected);

        AuthResponse actual = authService.refreshToken("refresh-token-old");

        Assertions.assertEquals("access-token-new", actual.getAccessToken());
        Assertions.assertEquals("refresh-token-new", actual.getRefreshToken());
        verify(authTokenRepository, times(2)).save(any(AuthToken.class));
    }

    private User buildUser(String id, String email, String passwordHash, String role, boolean active) {
        User user = new User();
        // Generate a valid UUID from the string ID for testing
        UUID uuid = UUID.nameUUIDFromBytes(id.getBytes());
        user.setId(uuid.toString());
        user.setEmail(email);
        user.setPasswordHash(passwordHash);
        user.setRole(role);
        user.setName("Test User");
        user.setPhone("9999999999");
        user.setActive(active);
        user.setVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return user;
    }
}