package com.civic.modules.ai.service;

import com.civic.infrastructure.ai.CoreAiService;
import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.complaint.entity.ComplaintDuplicate;
import com.civic.modules.complaint.repository.ComplaintDuplicateRepository;
import com.civic.modules.complaint.repository.ComplaintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Duplicate detection service.
 * Uses text similarity (Jaccard) to find near-duplicate complaints.
 * Threshold: 0.55 = likely duplicate, 0.75 = strong duplicate.
 */
@Service
@Transactional
public class DuplicateDetectionService {

    private static final Logger log = LoggerFactory.getLogger(DuplicateDetectionService.class);
    private static final double DUPLICATE_THRESHOLD = 0.55;
    private static final double STRONG_DUPLICATE_THRESHOLD = 0.75;
    private static final int CANDIDATE_WINDOW = 200; // compare against last N complaints

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private ComplaintDuplicateRepository duplicateRepository;

    @Autowired
    private CoreAiService aiService;

    /**
     * Check a new complaint against recent complaints for duplicates.
     * Returns a list of potential duplicates sorted by similarity score.
     */
    @Transactional(readOnly = true)
    public List<DuplicateCandidate> findDuplicates(String title, String description, String excludeId) {
        String newText = title + " " + description;

        // Fetch recent complaints as candidates
        List<Complaint> candidates = complaintRepository.findAll(
            PageRequest.of(0, CANDIDATE_WINDOW)
        ).getContent();

        List<DuplicateCandidate> results = new ArrayList<>();

        for (Complaint candidate : candidates) {
            if (excludeId != null && candidate.getId().toString().equals(excludeId)) continue;
            // Skip already-closed or cancelled
            if (candidate.getStatus() == Complaint.ComplaintStatus.CLOSED
                    || candidate.getStatus() == Complaint.ComplaintStatus.CANCELLED) continue;

            String candidateText = candidate.getTitle() + " " + candidate.getDescription();
            double similarity = aiService.computeTextSimilarity(newText, candidateText);

            if (similarity >= DUPLICATE_THRESHOLD) {
                results.add(new DuplicateCandidate(
                    candidate.getId().toString(),
                    candidate.getTitle(),
                    candidate.getStatus().name(),
                    (float) similarity,
                    similarity >= STRONG_DUPLICATE_THRESHOLD
                ));
            }
        }

        results.sort(Comparator.comparingDouble(DuplicateCandidate::similarity).reversed());
        return results;
    }

    /**
     * Mark a complaint as a duplicate of another and persist the relationship.
     */
    public ComplaintDuplicate markAsDuplicate(String complaintId, String originalId, float similarityScore) {
        UUID compUuid = UUID.fromString(complaintId);
        UUID origUuid = UUID.fromString(originalId);

        if (duplicateRepository.existsByComplaintIdAndDuplicateOfId(compUuid, origUuid)) {
            log.info("Duplicate relationship already exists: {} → {}", complaintId, originalId);
            return null;
        }

        Complaint complaint = complaintRepository.findById(compUuid)
            .orElseThrow(() -> new RuntimeException("Complaint not found: " + complaintId));
        Complaint original = complaintRepository.findById(origUuid)
            .orElseThrow(() -> new RuntimeException("Original complaint not found: " + originalId));

        complaint.setIsDuplicate(true);
        complaint.setStatus(Complaint.ComplaintStatus.DUPLICATE_CHECKED);
        complaintRepository.save(complaint);

        ComplaintDuplicate dup = new ComplaintDuplicate(complaint, original, similarityScore);
        return duplicateRepository.save(dup);
    }

    /**
     * Get all duplicates of a given complaint.
     */
    @Transactional(readOnly = true)
    public List<ComplaintDuplicate> getDuplicatesOf(String complaintId) {
        return duplicateRepository.findByOriginalComplaintId(UUID.fromString(complaintId));
    }

    // ── Result record ──────────────────────────────────────────────────────────

    public record DuplicateCandidate(
        String complaintId,
        String title,
        String status,
        float similarity,
        boolean isStrongDuplicate
    ) {}
}
