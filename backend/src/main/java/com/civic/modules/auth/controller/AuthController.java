package com.civic.modules.auth.controller;

import com.civic.common.Constants;
import com.civic.modules.auth.dto.AuthResponse;
import com.civic.modules.auth.dto.AuthenticatedUserResponse;
import com.civic.modules.auth.dto.LoginRequest;
import com.civic.modules.auth.dto.LogoutRequest;
import com.civic.modules.auth.dto.RefreshTokenRequest;
import com.civic.modules.auth.dto.SignupRequest;
import com.civic.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for authentication endpoints.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * User login endpoint.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * User signup endpoint.
     */
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Refresh authentication token.
     */
    @PostMapping({"/refresh", "/refresh-token"})
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    /**
     * Logout endpoint.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
        authService.revokeToken(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    /**
     * Get current authenticated user profile.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthenticatedUserResponse> me(
            Authentication authentication,
            @RequestHeader(name = Constants.JWT_TOKEN_HEADER, required = false) String authorizationHeader) {
        AuthenticatedUserResponse response;
        if (authentication != null && authentication.getName() != null) {
            response = authService.getCurrentUserById(authentication.getName());
        } else {
            response = authService.getCurrentUser(authorizationHeader);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Validate token endpoint.
     */
    @GetMapping("/validate")
    public ResponseEntity<Boolean> validateToken(@RequestHeader(Constants.JWT_TOKEN_HEADER) String token) {
        boolean isValid = authService.validateToken(token);
        return ResponseEntity.ok(isValid);
    }
}
