package com.civic.modules.feedback.repository;

import com.civic.modules.feedback.entity.ReopenRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReopenRequestRepository extends JpaRepository<ReopenRequest, UUID> {

    List<ReopenRequest> findByComplaintId(UUID complaintId);

    List<ReopenRequest> findByStatus(ReopenRequest.ReopenStatus status);

    long countByComplaintId(UUID complaintId);
}
