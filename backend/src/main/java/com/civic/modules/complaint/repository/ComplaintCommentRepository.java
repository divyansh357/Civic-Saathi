package com.civic.modules.complaint.repository;

import com.civic.modules.complaint.entity.ComplaintComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ComplaintCommentRepository extends JpaRepository<ComplaintComment, UUID> {
    List<ComplaintComment> findByComplaintIdOrderByCreatedAtAsc(UUID complaintId);
    long countByComplaintId(UUID complaintId);
}
