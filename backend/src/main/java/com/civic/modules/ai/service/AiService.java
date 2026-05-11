package com.civic.modules.ai.service;

import com.civic.infrastructure.ai.AiService.ClassificationResult;
import com.civic.modules.ai.dto.ClassificationRequest;
import com.civic.modules.ai.dto.ClassificationResponse;
import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.complaint.repository.ComplaintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Module-level AI service — orchestrates classification, summarisation,
 * duplicate detection and priority scoring for complaints.
 */
@Service
@Transactional
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    @Autowired
    private com.civic.infrastructure.ai.AiService coreAi;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private DuplicateDetectionService duplicateDetectionService;

    /**
     * Classify a complaint and optionally persist the result back to the entity.
     */
    public ClassificationResponse classifyComplaint(String complaintText, String complaintId) {
        // Try to load title + description from DB if complaintId provided
        String title = complaintText;
        String description = "";

        if (complaintId != null && !complaintId.isBlank()) {
            try {
                Complaint c = complaintRepository.findById(UUID.fromString(complaintId)).orElse(null);
                if (c != null) {
                    title = c.getTitle();
                    description = c.getDescription() != null ? c.getDescription() : "";
                }
            } catch (Exception e) {
                log.warn("Could not load complaint {}: {}", complaintId, e.getMessage());
            }
        }

        ClassificationResult result = coreAi.classifyComplaint(title, description);

        // Persist AI results back to complaint
        if (complaintId != null && !complaintId.isBlank()) {
            try {
                Complaint c = complaintRepository.findById(UUID.fromString(complaintId)).orElse(null);
                if (c != null) {
                    c.setAiSummary(coreAi.generateSummary(title, description, result.category(), c.getAddressText()));
                    c.setAiPriorityScore(scorePriority(result.suggestedPriority()));
                    c.setUpdatedAt(LocalDateTime.now());
                    complaintRepository.save(c);
                }
            } catch (Exception e) {
                log.warn("Could not persist AI results for complaint {}: {}", complaintId, e.getMessage());
            }
        }

        ClassificationResponse response = new ClassificationResponse();
        response.setComplaintId(complaintId);
        response.setCategory(result.category());
        response.setConfidence(result.confidence());
        response.setSuggestedDepartment(result.suggestedDepartment());
        response.setUrgencyLevel(result.suggestedPriority());
        return response;
    }

    /**
     * Classify from a request DTO (used by controller).
     */
    public ClassificationResponse classifyComplaint(ClassificationRequest request) {
        return classifyComplaint(request.getComplaintText(), request.getComplaintId());
    }

    /**
     * Generate a summary for a complaint.
     */
    public String generateSummary(String complaintId) {
        Complaint c = complaintRepository.findById(UUID.fromString(complaintId))
            .orElseThrow(() -> new RuntimeException("Complaint not found: " + complaintId));
        return coreAi.generateSummary(
            c.getTitle(),
            c.getDescription(),
            c.getCategories().isEmpty() ? "GENERAL" : c.getCategories().iterator().next().getName(),
            c.getAddressText()
        );
    }

    /**
     * Generate dashboard insights from analytics metrics.
     */
    public String generateInsights(String analysisScope) {
        // Build a simple metrics map from DB
        long total = complaintRepository.count();
        long escalated = complaintRepository.countByStatus(Complaint.ComplaintStatus.ESCALATED);
        long resolved = complaintRepository.countByStatus(Complaint.ComplaintStatus.RESOLVED);
        Double avgHours = complaintRepository.avgResolutionHours();

        Map<String, Object> metrics = Map.of(
            "scope", analysisScope,
            "totalComplaints", total,
            "escalatedComplaints", escalated,
            "resolvedComplaints", resolved,
            "averageResolutionTime", avgHours != null ? avgHours : 0.0,
            "slaBreachRate", total > 0 ? Math.round((escalated * 100.0 / total) * 10.0) / 10.0 : 0.0
        );

        return coreAi.generateDashboardInsights(metrics);
    }

    /**
     * Suggest optimal worker assignment (returns workerId or null).
     */
    public String suggestOptimalWorker(String complaintId, String departmentId) {
        // For now: return null — future: use proximity + workload scoring
        log.info("Worker suggestion requested for complaint {} in dept {}", complaintId, departmentId);
        return null;
    }

    /**
     * Predict resolution time in hours based on category and historical data.
     */
    public long predictResolutionTime(String complaintCategory) {
        // Rule-based prediction from historical averages
        return switch (complaintCategory.toUpperCase()) {
            case "ROADS"        -> 48;
            case "WATER"        -> 24;
            case "ELECTRICITY"  -> 12;
            case "SANITATION"   -> 36;
            case "PARKS"        -> 72;
            default             -> 48;
        };
    }

    /**
     * Check a complaint text for duplicates before submission.
     */
    public List<DuplicateDetectionService.DuplicateCandidate> checkDuplicates(
            String title, String description, String excludeId) {
        return duplicateDetectionService.findDuplicates(title, description, excludeId);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private float scorePriority(String priority) {
        return switch (priority.toUpperCase()) {
            case "CRITICAL" -> 1.0f;
            case "HIGH"     -> 0.75f;
            case "MEDIUM"   -> 0.5f;
            case "LOW"      -> 0.25f;
            default         -> 0.5f;
        };
    }
}
