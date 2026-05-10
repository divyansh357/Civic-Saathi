package com.civic.modules.complaint.repository;

import com.civic.modules.complaint.entity.Complaint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * JPA repository for Complaint entity.
 */
@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, String> {

    /**
     * Find all complaints by user ID.
     */
    @Query("SELECT c FROM Complaint c WHERE c.user.id = :userId")
    Page<Complaint> findByUserId(@Param("userId") String userId, Pageable pageable);

    /**
     * Find all complaints by department ID.
     */
    @Query("SELECT c FROM Complaint c WHERE c.department.id = :departmentId")
    Page<Complaint> findByDepartmentId(@Param("departmentId") String departmentId, Pageable pageable);

    /**
     * Find all complaints by status.
     */
    Page<Complaint> findByStatus(String status, Pageable pageable);

    /**
     * Find all complaints assigned to a worker.
     */
    @Query("SELECT c FROM Complaint c WHERE c.assignedWorker.id = :workerId")
    Page<Complaint> findByAssignedWorkerId(@Param("workerId") String workerId, Pageable pageable);

    /**
     * Find complaints by category and status.
     */
    @Query("SELECT c FROM Complaint c WHERE c.category = :category AND c.status = :status")
    Page<Complaint> findByCategoryAndStatus(@Param("category") String category, @Param("status") String status, Pageable pageable);

    /**
     * Find complaints created within a date range.
     */
    @Query("SELECT c FROM Complaint c WHERE c.createdAt BETWEEN :startDate AND :endDate")
    List<Complaint> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Count complaints by status.
     */
    long countByStatus(String status);

    /**
     * Count complaints by department.
     */
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") String departmentId);
}
