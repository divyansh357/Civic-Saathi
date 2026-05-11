package com.civic.modules.complaint.repository;

import com.civic.modules.complaint.entity.ComplaintSupportVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ComplaintSupportVoteRepository extends JpaRepository<ComplaintSupportVote, UUID> {
    long countByComplaintId(UUID complaintId);
    boolean existsByComplaintIdAndUserId(UUID complaintId, UUID userId);
    Optional<ComplaintSupportVote> findByComplaintIdAndUserId(UUID complaintId, UUID userId);
}
