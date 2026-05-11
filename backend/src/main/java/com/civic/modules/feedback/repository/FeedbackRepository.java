package com.civic.modules.feedback.repository;

import com.civic.modules.feedback.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    List<Feedback> findByComplaintId(UUID complaintId);

    Optional<Feedback> findByComplaintIdAndUserId(UUID complaintId, UUID userId);

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.complaint.id = :complaintId")
    Double avgRatingByComplaintId(@Param("complaintId") UUID complaintId);

    @Query("SELECT AVG(f.rating) FROM Feedback f")
    Double avgRatingOverall();

    long countByIsSatisfiedTrue();
}
