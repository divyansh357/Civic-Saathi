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
        Optional<Department> department = departmentRepository.findById(id);
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
     * Delete a department.
     */
    public void deleteDepartment(String id) {
        if (!departmentRepository.existsById(id)) {
            throw new RuntimeException("Department not found with ID: " + id);
        }
        departmentRepository.deleteById(id);
    }
}
