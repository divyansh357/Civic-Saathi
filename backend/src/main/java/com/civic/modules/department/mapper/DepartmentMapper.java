package com.civic.modules.department.mapper;

import com.civic.modules.department.dto.DepartmentResponse;
import com.civic.modules.department.entity.Department;
import org.springframework.stereotype.Component;

/**
 * Mapper for Department entity and DTOs.
 */
@Component
public class DepartmentMapper {
    public DepartmentResponse toResponse(Department department) {
        DepartmentResponse response = new DepartmentResponse();
        response.setId(department.getId());
        response.setName(department.getName());
        response.setDescription(department.getDescription());
        response.setEmail(department.getEmail());
        response.setPhone(department.getPhone());
        response.setCity(department.getCity() != null ? department.getCity().getName() : null);
        response.setCategoryType(department.getCategoryType());
        response.setActive(department.isActive());
        return response;
    }
}
