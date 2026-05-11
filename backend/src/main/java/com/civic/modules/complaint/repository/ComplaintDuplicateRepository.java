package com.civic.modules.complaint.repository;

import com.civic.modules.complaint.entity.ComplaintDuplicate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ComplaintDuplicateRepository extends JpaRepository<ComplaintDuplicate, UUID> {

    List<ComplaintDuplicate> findByComplaintId(UUID complaintId);

    @Query("SELECT cd FROM ComplaintDuplicate cd WHERE cd.duplicateOf.id = :originalId")
    List<ComplaintDuplicate> findByOriginalComplaintId(@Param("originalId") UUID originalId);

    boolean existsByComplaintIdAndDuplicateOfId(UUID complaintId, UUID duplicateOfId);
}
