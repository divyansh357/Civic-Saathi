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
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    @Autowired
    private UserService userService;

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
