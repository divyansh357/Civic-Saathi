package com.civic.modules.auth.controller;

import com.civic.modules.auth.dto.AuthResponse;
import com.civic.modules.auth.dto.LoginRequest;
import com.civic.modules.auth.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for authentication endpoints.
 */
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * User login endpoint.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * User signup endpoint.
     */
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody LoginRequest request) {
        // TODO: Implement signup logic
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * Refresh authentication token.
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(@RequestHeader("Authorization") String token) {
        // TODO: Extract userId from token and refresh
        return ResponseEntity.ok().build();
    }

    /**
     * Logout endpoint.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String token) {
        authService.revokeToken(token);
        return ResponseEntity.noContent().build();
    }

    /**
     * Validate token endpoint.
     */
    @GetMapping("/validate")
    public ResponseEntity<Boolean> validateToken(@RequestHeader("Authorization") String token) {
        boolean isValid = authService.validateToken(token);
        return ResponseEntity.ok(isValid);
    }
}
