package com.civic.modules.department.repository;

import com.civic.modules.department.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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
    
    /**
     * Find department by category type and city.
     */
    @Query("SELECT d FROM Department d WHERE d.categoryType = :categoryType AND d.city = :city AND d.active = true")
    Optional<Department> findByCategoryTypeAndCity(@Param("categoryType") String categoryType, @Param("city") String city);
    
    /**
     * Find all active departments in a city.
     */
    @Query("SELECT d FROM Department d WHERE d.active = :active AND d.city = :city")
    List<Department> findByActiveAndCity(@Param("active") boolean active, @Param("city") String city);
}
