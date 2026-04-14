package com.civic.modules.user.mapper;

import com.civic.modules.user.dto.UserResponse;
import com.civic.modules.user.entity.User;
import org.springframework.stereotype.Component;

/**
 * Mapper for User entity and DTOs.
 */
@Component
public class UserMapper {
    public UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole());
        response.setCity(user.getCity());
        response.setProfilePictureUrl(user.getProfilePictureUrl());
        response.setVerified(user.isVerified());
        return response;
    }
}
