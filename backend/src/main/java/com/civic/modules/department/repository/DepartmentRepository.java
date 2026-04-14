package com.civic.modules.department.repository;

import com.civic.modules.department.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Department entity.
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, String> {
    Optional<Department> findByNameIgnoreCase(String name);
    Page<Department> findByActive(boolean active, Pageable pageable);
    Page<Department> findByCategoryType(String categoryType, Pageable pageable);
    long countByActive(boolean active);
}
