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
 * Field names match Assignment entity: worker (not assignedWorker), deadlineAt (not slaDeadline).
 */
@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

    /** Find assignment by complaint ID. */
    @Query("SELECT a FROM Assignment a WHERE a.complaint.id = :complaintId")
    Optional<Assignment> findByComplaintId(@Param("complaintId") UUID complaintId);

    /** Find assignments by worker ID. */
    @Query("SELECT a FROM Assignment a WHERE a.worker.id = :workerId")
    Page<Assignment> findByWorkerId(@Param("workerId") UUID workerId, Pageable pageable);

    /** Find assignments by worker ID and status. */
    @Query("SELECT a FROM Assignment a WHERE a.worker.id = :workerId AND a.status = :status")
    Page<Assignment> findByWorkerIdAndStatus(@Param("workerId") UUID workerId, @Param("status") Assignment.AssignmentStatus status, Pageable pageable);

    /** Find assignments by status enum. */
    Page<Assignment> findByStatus(Assignment.AssignmentStatus status, Pageable pageable);

    /** Find overdue assignments (past deadline, not completed/cancelled). */
    @Query("SELECT a FROM Assignment a WHERE a.deadlineAt < :currentTime " +
           "AND a.status NOT IN " +
           "(com.civic.modules.assignment.entity.Assignment.AssignmentStatus.COMPLETED, " +
           "com.civic.modules.assignment.entity.Assignment.AssignmentStatus.CANCELLED)")
    List<Assignment> findOverdueAssignments(@Param("currentTime") LocalDateTime currentTime);

    /** Find active assignments for a worker. */
    @Query("SELECT a FROM Assignment a WHERE a.worker.id = :workerId " +
           "AND a.status NOT IN " +
           "(com.civic.modules.assignment.entity.Assignment.AssignmentStatus.COMPLETED, " +
           "com.civic.modules.assignment.entity.Assignment.AssignmentStatus.CANCELLED)")
    List<Assignment> findActiveByWorkerId(@Param("workerId") UUID workerId);
}
