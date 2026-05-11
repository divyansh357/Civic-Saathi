package com.civic.modules.ai.controller;

import com.civic.infrastructure.ai.CerebrasClient;
import com.civic.modules.ai.dto.ClassificationRequest;
import com.civic.modules.ai.dto.ClassificationResponse;
import com.civic.modules.ai.service.AiService;
import com.civic.modules.ai.service.DuplicateDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for AI-powered endpoints.
 */
@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AiController {

    @Autowired
    private AiService aiService;

    @Autowired
    private CerebrasClient cerebrasClient;

    /** Classify a complaint into a category with confidence score. */
    @PostMapping("/classify")
    public ResponseEntity<ClassificationResponse> classifyComplaint(
            @RequestBody ClassificationRequest request) {
        return ResponseEntity.ok(aiService.classifyComplaint(request));
    }

    /** Generate a concise summary for a complaint. */
    @GetMapping("/summary/{complaintId}")
    public ResponseEntity<Map<String, String>> generateSummary(@PathVariable String complaintId) {
        String summary = aiService.generateSummary(complaintId);
        return ResponseEntity.ok(Map.of("complaintId", complaintId, "summary", summary));
    }

    /** Generate dashboard insights for a given scope. */
    @GetMapping("/insights")
    public ResponseEntity<Map<String, String>> generateInsights(
            @RequestParam(defaultValue = "all") String scope) {
        String insights = aiService.generateInsights(scope);
        return ResponseEntity.ok(Map.of("scope", scope, "insights", insights));
    }

    /** Check for duplicate complaints before submission. */
    @PostMapping("/duplicate-check")
    public ResponseEntity<Map<String, Object>> checkDuplicates(
            @RequestBody Map<String, String> body) {
        String title = body.getOrDefault("title", "");
        String description = body.getOrDefault("description", "");
        String excludeId = body.get("excludeId");

        List<DuplicateDetectionService.DuplicateCandidate> candidates =
            aiService.checkDuplicates(title, description, excludeId);

        return ResponseEntity.ok(Map.of(
            "hasDuplicates", !candidates.isEmpty(),
            "candidates", candidates,
            "count", candidates.size()
        ));
    }

    /** Predict resolution time for a complaint category. */
    @GetMapping("/predict-resolution")
    public ResponseEntity<Map<String, Object>> predictResolutionTime(
            @RequestParam String category) {
        long hours = aiService.predictResolutionTime(category);
        return ResponseEntity.ok(Map.of(
            "category", category,
            "estimatedHours", hours,
            "estimatedDays", hours / 24.0
        ));
    }

    /** Suggest optimal worker for a complaint. */
    @PostMapping("/suggest-worker")
    public ResponseEntity<Map<String, Object>> suggestWorker(
            @RequestParam String complaintId,
            @RequestParam String departmentId) {
        String workerId = aiService.suggestOptimalWorker(complaintId, departmentId);
        return ResponseEntity.ok(Map.of(
            "complaintId", complaintId,
            "suggestedWorkerId", workerId != null ? workerId : "",
            "available", workerId != null
        ));
    }

    /** Health check — reports whether LLM is configured. */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAiStatus() {
        return ResponseEntity.ok(Map.of(
            "llmAvailable", cerebrasClient.isAvailable(),
            "provider", cerebrasClient.isAvailable() ? "Cerebras" : "Rule-based fallback",
            "features", List.of("classification", "summarization", "duplicate-detection",
                                "priority-scoring", "insights", "resolution-prediction")
        ));
    }
}
