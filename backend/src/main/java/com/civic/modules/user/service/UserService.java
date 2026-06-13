package com.civic.modules.user.service;

import com.civic.modules.user.dto.ProfileUpdateRequest;
import com.civic.modules.user.dto.UserResponse;
import com.civic.modules.user.entity.User;
import com.civic.modules.user.mapper.UserMapper;
import com.civic.modules.user.repository.UserRepository;
import com.civic.modules.geography.repository.CityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for user management.
 */
@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private CityRepository cityRepository;

    /**
     * Get all users (paginated).
     */
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toResponse);
    }

    /**
     * Get user by ID.
     */
    public UserResponse getUserById(String id) {
        Optional<User> user = userRepository.findById(UUID.fromString(id));
        if (user.isPresent()) {
            return userMapper.toResponse(user.get());
        }
        throw new RuntimeException("User not found with ID: " + id);
    }

    /**
     * Get user by email.
     */
    public UserResponse getUserByEmail(String email) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            return userMapper.toResponse(user.get());
        }
        throw new RuntimeException("User not found with email: " + email);
    }

    /**
     * Get users by role.
     */
    public Page<UserResponse> getUsersByRole(String role, Pageable pageable) {
        return userRepository.findByRole(role, pageable)
                .map(userMapper::toResponse);
    }

    /**
     * Update user profile using a dedicated update DTO.
     */
    public UserResponse updateUserProfile(String id, ProfileUpdateRequest updateData) {
        Optional<User> userOptional = userRepository.findById(UUID.fromString(id));
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found with ID: " + id);
        }

        User user = userOptional.get();
        if (updateData.getName() != null) user.setName(updateData.getName());
        if (updateData.getPhone() != null) user.setPhone(updateData.getPhone());
        if (updateData.getAddress() != null) user.setAddress(updateData.getAddress());
        // Aadhar is locked once set — only update if it is currently empty
        if (updateData.getAadharNumber() != null
                && (user.getAadharNumber() == null || user.getAadharNumber().isBlank())) {
            String aadhar = updateData.getAadharNumber().trim();
            if (!aadhar.matches("\\d{12}")) {
                throw new IllegalArgumentException("Aadhar number must contain exactly 12 numeric digits");
            }
            user.setAadharNumber(aadhar);
        }
        if (updateData.getZoneNumber() != null) user.setZoneNumber(updateData.getZoneNumber());
        if (updateData.getProfilePictureUrl() != null) user.setProfilePictureUrl(updateData.getProfilePictureUrl());
        if (updateData.getDepartmentCode() != null && !updateData.getDepartmentCode().isBlank()) {
            user.setDepartmentCode(updateData.getDepartmentCode().trim().toUpperCase());
        }
        if (updateData.getCityId() != null && !updateData.getCityId().isBlank()) {
            cityRepository.findById(UUID.fromString(updateData.getCityId()))
                .ifPresent(user::setCity);
        }

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);
        return userMapper.toResponse(updatedUser);
    }

    /**
     * Update user profile (legacy — accepts raw User entity for backward compatibility).
     * @deprecated Use updateUserProfile(String, ProfileUpdateRequest) instead.
     */
    @Deprecated
    public UserResponse updateUserProfile(String id, User updateData) {
        Optional<User> userOptional = userRepository.findById(UUID.fromString(id));
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found with ID: " + id);
        }

        User user = userOptional.get();
        if (updateData.getName() != null) user.setName(updateData.getName());
        if (updateData.getPhone() != null) user.setPhone(updateData.getPhone());
        if (updateData.getCity() != null) user.setCity(updateData.getCity());
        if (updateData.getProfilePictureUrl() != null) user.setProfilePictureUrl(updateData.getProfilePictureUrl());
        if (updateData.getAddress() != null) user.setAddress(updateData.getAddress());
        if (updateData.getAadharNumber() != null) {
            String aadhar = updateData.getAadharNumber().trim();
            if (!aadhar.matches("\\d{12}")) {
                throw new IllegalArgumentException("Aadhar number must contain exactly 12 numeric digits");
            }
            user.setAadharNumber(aadhar);
        }
        if (updateData.getZoneNumber() != null) user.setZoneNumber(updateData.getZoneNumber());

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);
        return userMapper.toResponse(updatedUser);
    }

    /**
     * Delete user.
     */
    public void deleteUser(String id) {
        UUID uuid = UUID.fromString(id);
        if (!userRepository.existsById(uuid)) {
            throw new RuntimeException("User not found with ID: " + id);
        }
        userRepository.deleteById(uuid);
    }
}
