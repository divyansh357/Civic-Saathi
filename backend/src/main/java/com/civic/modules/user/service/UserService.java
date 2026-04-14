package com.civic.modules.user.service;

import com.civic.modules.user.dto.UserResponse;
import com.civic.modules.user.entity.User;
import com.civic.modules.user.mapper.UserMapper;
import com.civic.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

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

    /**
     * Get user by ID.
     */
    public UserResponse getUserById(String id) {
        Optional<User> user = userRepository.findById(id);
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
     * Update user profile.
     */
    public UserResponse updateUserProfile(String id, User updateData) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found with ID: " + id);
        }

        User user = userOptional.get();
        if (updateData.getName() != null) user.setName(updateData.getName());
        if (updateData.getPhone() != null) user.setPhone(updateData.getPhone());
        if (updateData.getCity() != null) user.setCity(updateData.getCity());
        if (updateData.getProfilePictureUrl() != null) user.setProfilePictureUrl(updateData.getProfilePictureUrl());

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);
        return userMapper.toResponse(updatedUser);
    }

    /**
     * Delete user.
     */
    public void deleteUser(String id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with ID: " + id);
        }
        userRepository.deleteById(id);
    }
}
