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
import java.util.UUID;

/**
 * JPA repository for Complaint entity.
 */
@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {

    /** Find complaints by the user who created them. */
    @Query("SELECT c FROM Complaint c WHERE c.createdBy.id = :userId")
    Page<Complaint> findByUserId(@Param("userId") String userId, Pageable pageable);

    /** Find complaints by department. */
    @Query("SELECT c FROM Complaint c WHERE c.department.id = :departmentId")
    Page<Complaint> findByDepartmentId(@Param("departmentId") String departmentId, Pageable pageable);

    /** Find complaints by status string (uses enum name). */
    @Query("SELECT c FROM Complaint c WHERE CAST(c.status AS string) = :status")
    Page<Complaint> findByStatus(@Param("status") String status, Pageable pageable);

    /** Find complaints by status enum. */
    Page<Complaint> findByStatus(Complaint.ComplaintStatus status, Pageable pageable);

    /** Find complaints assigned to a specific worker. */
    @Query("SELECT c FROM Complaint c WHERE c.assignedWorker.id = :workerId")
    Page<Complaint> findByAssignedWorkerId(@Param("workerId") String workerId, Pageable pageable);

    /** Find complaints created within a date range. */
    @Query("SELECT c FROM Complaint c WHERE c.createdAt BETWEEN :startDate AND :endDate ORDER BY c.createdAt DESC")
    List<Complaint> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate);

    /** Count complaints by status string. */
    @Query("SELECT COUNT(c) FROM Complaint c WHERE CAST(c.status AS string) = :status")
    long countByStatus(@Param("status") String status);

    /** Count complaints by status enum. */
    long countByStatus(Complaint.ComplaintStatus status);

    /** Count complaints by department. */
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") String departmentId);

    /** Count complaints by department and status. */
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.department.id = :departmentId AND c.status = :status")
    long countByDepartmentIdAndStatus(@Param("departmentId") UUID departmentId,
                                      @Param("status") Complaint.ComplaintStatus status);

    /** Find SLA-breached complaints (past deadline, not yet resolved/closed). */
    @Query("SELECT c FROM Complaint c WHERE c.slaDeadline IS NOT NULL AND c.slaDeadline < :now " +
           "AND c.status NOT IN (com.civic.modules.complaint.entity.Complaint.ComplaintStatus.RESOLVED, " +
           "com.civic.modules.complaint.entity.Complaint.ComplaintStatus.CLOSED, " +
           "com.civic.modules.complaint.entity.Complaint.ComplaintStatus.CANCELLED)")
    List<Complaint> findSlaBreachedComplaints(@Param("now") LocalDateTime now);

    /** Count SLA-breached complaints. */
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.slaDeadline IS NOT NULL AND c.slaDeadline < :now " +
           "AND c.status NOT IN (com.civic.modules.complaint.entity.Complaint.ComplaintStatus.RESOLVED, " +
           "com.civic.modules.complaint.entity.Complaint.ComplaintStatus.CLOSED, " +
           "com.civic.modules.complaint.entity.Complaint.ComplaintStatus.CANCELLED)")
    long countSlaBreachedComplaints(@Param("now") LocalDateTime now);

    /** Count complaints created in a date range. */
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.createdAt BETWEEN :startDate AND :endDate")
    long countByCreatedAtBetween(@Param("startDate") LocalDateTime startDate,
                                  @Param("endDate") LocalDateTime endDate);

    /** Average resolution time in hours for resolved complaints. */
    @Query("SELECT AVG(FUNCTION('TIMESTAMPDIFF', HOUR, c.createdAt, c.resolvedAt)) " +
           "FROM Complaint c WHERE c.resolvedAt IS NOT NULL")
    Double avgResolutionHours();

    /** Count complaints grouped by status (for analytics). */
    @Query("SELECT CAST(c.status AS string), COUNT(c) FROM Complaint c GROUP BY c.status")
    List<Object[]> countGroupedByStatus();

    /** Count complaints grouped by department name (for analytics). */
    @Query("SELECT d.name, COUNT(c) FROM Complaint c JOIN c.department d GROUP BY d.name")
    List<Object[]> countGroupedByDepartment();

    /** Find duplicate complaints. */
    @Query("SELECT c FROM Complaint c WHERE c.isDuplicate = true")
    List<Complaint> findDuplicateComplaints();

    /** Search complaints by title or description. */
    @Query("SELECT c FROM Complaint c WHERE LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Complaint> searchComplaints(@Param("query") String query, Pageable pageable);

    /** Find complaints by ward. */
    @Query("SELECT c FROM Complaint c WHERE c.ward.id = :wardId")
    Page<Complaint> findByWardId(@Param("wardId") UUID wardId, Pageable pageable);
}
