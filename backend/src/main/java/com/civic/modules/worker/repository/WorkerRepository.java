package com.civic.modules.worker.repository;

import com.civic.modules.worker.entity.Worker;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Worker entity.
 */
@Repository
public interface WorkerRepository extends JpaRepository<Worker, UUID> {
    @Query("SELECT w FROM Worker w WHERE w.user.id = :userId")
    Optional<Worker> findByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT w FROM Worker w WHERE w.department.id = :departmentId")
    Page<Worker> findByDepartmentId(@Param("departmentId") UUID departmentId, Pageable pageable);
    
    Page<Worker> findByStatus(String status, Pageable pageable);
    
    @Query("SELECT COUNT(w) FROM Worker w WHERE w.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") UUID departmentId);
    
    /**
     * Find available workers by department (status = ACTIVE).
     */
    @Query("SELECT w FROM Worker w WHERE w.department.id = :departmentId AND w.status = 'ACTIVE' ORDER BY w.complaintsAssigned ASC")
    List<Worker> findAvailableWorkersByDepartment(@Param("departmentId") UUID departmentId);
}
