package com.civic.modules.assignment.repository;

import com.civic.modules.assignment.entity.Assignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Assignment entity.
 */
@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

    /**
     * Find assignment by complaint ID.
     */
    @Query("SELECT a FROM Assignment a WHERE a.complaint.id = :complaintId")
    Optional<Assignment> findByComplaintId(@Param("complaintId") UUID complaintId);

    /**
     * Find assignments by department ID.
     */
    @Query("SELECT a FROM Assignment a WHERE a.department.id = :departmentId")
    Page<Assignment> findByDepartmentId(@Param("departmentId") UUID departmentId, Pageable pageable);

    /**
     * Find assignments by worker ID.
     */
    @Query("SELECT a FROM Assignment a WHERE a.assignedWorker.id = :workerId")
    Page<Assignment> findByAssignedWorkerId(@Param("workerId") UUID workerId, Pageable pageable);

    /**
     * Find assignments by status.
     */
    Page<Assignment> findByStatus(String status, Pageable pageable);

    /**
     * Find overdue assignments (past SLA deadline).
     */
    @Query("SELECT a FROM Assignment a WHERE a.slaDeadline < :currentTime AND a.status NOT IN ('COMPLETED', 'ESCALATED')")
    List<Assignment> findOverdueAssignments(@Param("currentTime") LocalDateTime currentTime);

    /**
     * Find assignments by priority.
     */
    Page<Assignment> findByPriority(Integer priority, Pageable pageable);

    /**
     * Count assignments by department.
     */
    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") UUID departmentId);

    /**
     * Count assignments by worker.
     */
    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.assignedWorker.id = :workerId")
    long countByAssignedWorkerId(@Param("workerId") UUID workerId);

    /**
     * Count assignments by status.
     */
    long countByStatus(String status);
}
