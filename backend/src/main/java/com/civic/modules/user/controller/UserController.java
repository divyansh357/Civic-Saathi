package com.civic.modules.user.controller;

import com.civic.modules.user.dto.UserResponse;
import com.civic.modules.user.entity.User;
import com.civic.modules.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for user management endpoints.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Get current user's own profile (uses JWT identity).
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(@RequestHeader("User-Id") String userId) {
        UserResponse response = userService.getUserById(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Update current user's own profile.
     */
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMyProfile(
            @RequestHeader("User-Id") String userId,
            @RequestBody User updateData) {
        UserResponse response = userService.updateUserProfile(userId, updateData);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all users (admin only).
     */
    @GetMapping
    public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
        Page<UserResponse> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    /**
     * Get user by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get user by email.
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        UserResponse response = userService.getUserByEmail(email);
        return ResponseEntity.ok(response);
    }

    /**
     * Get users by role.
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<Page<UserResponse>> getUsersByRole(@PathVariable String role, Pageable pageable) {
        Page<UserResponse> users = userService.getUsersByRole(role, pageable);
        return ResponseEntity.ok(users);
    }

    /**
     * Update user profile.
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUserProfile(@PathVariable String id, @RequestBody User updateData) {
        UserResponse response = userService.updateUserProfile(id, updateData);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete user.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
