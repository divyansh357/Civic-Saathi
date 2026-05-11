package com.civic.modules.department.service;

import com.civic.modules.department.dto.DepartmentResponse;
import com.civic.modules.department.entity.Department;
import com.civic.modules.department.mapper.DepartmentMapper;
import com.civic.modules.department.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for department management.
 */
@Service
@Transactional
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DepartmentMapper departmentMapper;

    /**
     * Get all active departments.
     */
    public Page<DepartmentResponse> getAllDepartments(Pageable pageable) {
        return departmentRepository.findByActive(true, pageable)
                .map(departmentMapper::toResponse);
    }

    /**
     * Get department by ID.
     */
    public DepartmentResponse getDepartmentById(String id) {
        Optional<Department> department = departmentRepository.findById(UUID.fromString(id));
        if (department.isPresent()) {
            return departmentMapper.toResponse(department.get());
        }
        throw new RuntimeException("Department not found with ID: " + id);
    }

    /**
     * Get departments by category type.
     */
    public Page<DepartmentResponse> getDepartmentsByCategory(String categoryType, Pageable pageable) {
        return departmentRepository.findByCategoryType(categoryType, pageable)
                .map(departmentMapper::toResponse);
    }

    /**
     * Create a new department.
     */
    public DepartmentResponse createDepartment(Department department) {
        department.setCreatedAt(LocalDateTime.now());
        department.setUpdatedAt(LocalDateTime.now());
        Department savedDepartment = departmentRepository.save(department);
        return departmentMapper.toResponse(savedDepartment);
    }

    /**
     * Update an existing department.
     */
    public DepartmentResponse updateDepartment(String id, Department updates) {
        Department department = departmentRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new RuntimeException("Department not found: " + id));
        if (updates.getName() != null) department.setName(updates.getName());
        if (updates.getDescription() != null) department.setDescription(updates.getDescription());
        if (updates.getEmail() != null) department.setEmail(updates.getEmail());
        if (updates.getPhone() != null) department.setPhone(updates.getPhone());
        if (updates.getActive() != null) department.setActive(updates.getActive());
        department.setUpdatedAt(LocalDateTime.now());
        return departmentMapper.toResponse(departmentRepository.save(department));
    }

    /**
     * Delete a department.
     */
    public void deleteDepartment(String id) {
        UUID uuid = UUID.fromString(id);
        if (!departmentRepository.existsById(uuid)) {
            throw new RuntimeException("Department not found with ID: " + id);
        }
        departmentRepository.deleteById(uuid);
    }
}
