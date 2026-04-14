package com.civic.modules.ai.controller;

import com.civic.modules.ai.dto.ClassificationRequest;
import com.civic.modules.ai.dto.ClassificationResponse;
import com.civic.modules.ai.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for AI-powered endpoints.
 */
@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AiController {

    @Autowired
    private AiService aiService;

    /**
     * Classify complaint using AI/LLM.
     */
    @PostMapping("/classify-complaint")
    public ResponseEntity<ClassificationResponse> classifyComplaint(@RequestBody ClassificationRequest request) {
        ClassificationResponse response = aiService.classifyComplaint(request.getComplaintText(), request.getComplaintId());
        return ResponseEntity.ok(response);
    }

    /**
     * Generate insights from complaints.
     */
    @PostMapping("/generate-insights")
    public ResponseEntity<String> generateInsights(@RequestParam String analysisScope) {
        String insights = aiService.generateInsights(analysisScope);
        return ResponseEntity.ok(insights);
    }

    /**
     * Suggest optimal worker assignment.
     */
    @PostMapping("/suggest-worker")
    public ResponseEntity<String> suggestWorker(
            @RequestParam String complaintId,
            @RequestParam String departmentId) {
        String workerId = aiService.suggestOptimalWorker(complaintId, departmentId);
        return ResponseEntity.ok(workerId);
    }

    /**
     * Predict complaint resolution time.
     */
    @GetMapping("/predict-resolution-time")
    public ResponseEntity<Long> predictResolutionTime(@RequestParam String complaintCategory) {
        long estimatedTime = aiService.predictResolutionTime(complaintCategory);
        return ResponseEntity.ok(estimatedTime);
    }
}
