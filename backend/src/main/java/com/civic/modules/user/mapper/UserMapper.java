package com.civic.modules.user.mapper;

import com.civic.modules.auth.entity.Role;
import com.civic.modules.user.dto.UserResponse;
import com.civic.modules.user.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

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
        response.setRole(primaryRole(user));
        response.setCity(user.getCity() != null ? user.getCity().getName() : null);
        response.setProfilePictureUrl(user.getProfilePictureUrl());
        response.setAddress(user.getAddress());
        response.setAadharNumber(user.getAadharNumber());
        response.setZoneNumber(user.getZoneNumber());
        response.setVerified(user.isVerified());
        response.setStatus(user.getStatus());
        // Profile is complete when address and aadharNumber are both filled in
        boolean complete = user.getAddress() != null && !user.getAddress().isBlank()
                && user.getAadharNumber() != null && !user.getAadharNumber().isBlank();
        response.setProfileComplete(complete);
        return response;
    }

    private String primaryRole(User user) {
        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        if (roleNames.contains("ADMIN") || roleNames.contains("SUPERADMIN") || roleNames.contains("DEPARTMENT_ADMIN")) return "ADMIN";
        if (roleNames.contains("OFFICER")) return "OFFICER";
        if (roleNames.contains("WORKER")) return "WORKER";
        if (roleNames.contains("CITIZEN")) return "CITIZEN";
        return roleNames.isEmpty() ? "CITIZEN" : roleNames.get(0);
    }
}
