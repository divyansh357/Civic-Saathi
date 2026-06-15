package com.civic.modules.department.controller;

import com.civic.modules.department.dto.DepartmentResponse;
import com.civic.modules.department.entity.Department;
import com.civic.modules.department.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

/**
 * REST Controller for department management endpoints.
 */
@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    /**
     * Get all departments.
     */
    @Cacheable(value = "staticData", key = "'all_departments_page_' + #pageable.pageNumber + '_size_' + #pageable.pageSize")
    @GetMapping
    public ResponseEntity<Page<DepartmentResponse>> getAllDepartments(Pageable pageable) {
        Page<DepartmentResponse> departments = departmentService.getAllDepartments(pageable);
        return ResponseEntity.ok(departments);
    }

    /**
     * Get department by ID.
     */
    @Cacheable(value = "staticData", key = "'department_' + #id")
    @GetMapping("/{id}")
    public ResponseEntity<DepartmentResponse> getDepartmentById(@PathVariable String id) {
        DepartmentResponse response = departmentService.getDepartmentById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get departments by category.
     */
    @Cacheable(value = "staticData", key = "'dept_category_' + #categoryType + '_page_' + #pageable.pageNumber + '_size_' + #pageable.pageSize")
    @GetMapping("/category/{categoryType}")
    public ResponseEntity<Page<DepartmentResponse>> getDepartmentsByCategory(
            @PathVariable String categoryType,
            Pageable pageable) {
        Page<DepartmentResponse> departments = departmentService.getDepartmentsByCategory(categoryType, pageable);
        return ResponseEntity.ok(departments);
    }

    /**
     * Create a new department.
     */
    @CacheEvict(value = "staticData", allEntries = true)
    @PostMapping
    public ResponseEntity<DepartmentResponse> createDepartment(@RequestBody Department department) {
        DepartmentResponse response = departmentService.createDepartment(department);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update a department.
     */
    @CacheEvict(value = "staticData", allEntries = true)
    @PutMapping("/{id}")
    public ResponseEntity<DepartmentResponse> updateDepartment(
            @PathVariable String id,
            @RequestBody Department department) {
        DepartmentResponse response = departmentService.updateDepartment(id, department);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a department.
     */
    @CacheEvict(value = "staticData", allEntries = true)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable String id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }
}
