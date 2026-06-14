package com.civic.modules.complaint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiVerificationService {

    @Value("${ai.cerebras.api-key:}")
    private String apiKey;

    @Value("${ai.cerebras.model:gpt-oss-120b}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final com.civic.infrastructure.ai.OpenRouterVisionClient openRouterVisionClient;

    public AiVerificationService(com.civic.infrastructure.ai.OpenRouterVisionClient openRouterVisionClient) {
        this.openRouterVisionClient = openRouterVisionClient;
    }

    public AiVerificationResult verifyComplaint(String title, String description, String category, List<String> imageUrls) {
        if (imageUrls != null && !imageUrls.isEmpty()) {
            return verifyComplaintWithImages(title, description, category, imageUrls);
        }

        if (apiKey == null || apiKey.isBlank()) {
            return new AiVerificationResult(false, 0.0f, "AI Verification skipped: No API key provided.");
        }

        String url = "https://api.cerebras.ai/v1/chat/completions";

        String prompt = String.format(
            "You are a strict AI civic auditor. Analyze the citizen complaint text below to determine if it is a GENUINE civic issue that requires municipal attention.\n\n" +
            "Title: %s\n" +
            "Category: %s\n" +
            "Description: %s\n\n" +
            "Rules for verification:\n" +
            "1. Reject spam, tests, gibberish, and complaints unrelated to public civic infrastructure (e.g., personal disputes).\n" +
            "2. Accept valid civic issues (e.g., potholes, broken streetlights, water leaks, garbage dumps).\n" +
            "3. If description is too vague, mark it invalid.\n\n" +
            "Provide a JSON response EXACTLY in this format, with no markdown tags:\n" +
            "{\"is_valid\": true/false, \"confidence_score\": 0.0-1.0, \"summary\": \"Brief 1-2 sentence explanation of your reasoning\"}",
            title, category != null ? category : "Unknown", description
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", modelName);
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.1);
        requestBody.put("response_format", Map.of("type", "json_object"));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            String responseStr = restTemplate.postForObject(url, entity, String.class);
            return parseAiResponse(responseStr);
        } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e) {
            return new AiVerificationResult(true, 1.0f, "Skipped AI verification due to rate limits. Needs manual review."); // Return true to not block submission, but handled differently if needed
        } catch (Exception e) {
            e.printStackTrace();
            return new AiVerificationResult(false, 0.0f, "AI Verification failed due to an error: " + e.getMessage());
        }
    }

    private AiVerificationResult verifyComplaintWithImages(String title, String description, String category, List<String> imageUrls) {
        String prompt = String.format(
            "You are a strict AI civic auditor with vision capabilities. Analyze the citizen complaint text and provided images to determine if it is a GENUINE civic issue.\n\n" +
            "Title: %s\n" +
            "Category: %s\n" +
            "Description: %s\n\n" +
            "Rules for verification:\n" +
            "1. Verify that the images match the text description. If the user complains about a pothole but uploads a picture of a cat, reject it.\n" +
            "2. Reject spam, tests, and non-civic issues.\n" +
            "3. Provide a JSON response EXACTLY in this format:\n" +
            "{\"is_valid\": true/false, \"confidence_score\": 0.0-1.0, \"summary\": \"Brief explanation\"}",
            title, category != null ? category : "Unknown", description
        );

        try {
            String responseStr = openRouterVisionClient.analyzeImages(prompt, imageUrls);
            if (responseStr == null) {
                return new AiVerificationResult(false, 0.0f, "Vision verification failed to analyze");
            }
            return parseAiResponse(responseStr);
        } catch (com.civic.infrastructure.ai.OpenRouterVisionClient.RateLimitException e) {
            // Fail open for rate limits
            return new AiVerificationResult(true, 1.0f, "Skipped AI verification due to rate limits.");
        } catch (Exception e) {
            e.printStackTrace();
            return new AiVerificationResult(false, 0.0f, "Vision Verification failed: " + e.getMessage());
        }
    }

    private AiVerificationResult parseAiResponse(String responseStr) throws Exception {
        String cleanResponse = responseStr.trim();
        if (cleanResponse.startsWith("```json")) {
            cleanResponse = cleanResponse.replace("```json", "").replace("```", "").trim();
        } else if (cleanResponse.startsWith("```")) {
            cleanResponse = cleanResponse.replace("```", "").trim();
        }

        JsonNode aiJson = objectMapper.readTree(cleanResponse);
        
        boolean isValid = aiJson.has("isValid") ? aiJson.get("isValid").asBoolean() : aiJson.path("is_valid").asBoolean(true);
        float confidenceScore = aiJson.has("confidence") ? (float) aiJson.get("confidence").asDouble() : (float) aiJson.path("confidence_score").asDouble(1.0);
        String summary = aiJson.has("reason") ? aiJson.get("reason").asText() : aiJson.path("summary").asText("No summary provided.");

        return new AiVerificationResult(isValid, confidenceScore, summary);
    }

    public static class AiVerificationResult {
        public final boolean isValid;
        public final float confidenceScore;
        public final String summary;

        public AiVerificationResult(boolean isValid, float confidenceScore, String summary) {
            this.isValid = isValid;
            this.confidenceScore = confidenceScore;
            this.summary = summary;
        }
    }
}
