package com.civic.modules.worker.repository;

import com.civic.modules.worker.entity.Worker;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Worker entity.
 */
@Repository
public interface WorkerRepository extends JpaRepository<Worker, String> {
    Optional<Worker> findByUserId(String userId);
    Page<Worker> findByDepartmentId(String departmentId, Pageable pageable);
    Page<Worker> findByStatus(String status, Pageable pageable);
    long countByDepartmentId(String departmentId);
}
