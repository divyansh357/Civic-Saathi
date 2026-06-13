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

    public AiVerificationResult verifyComplaint(String title, String description, String category) {
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
            JsonNode root = objectMapper.readTree(responseStr);
            String aiResponseContent = root.path("choices").get(0).path("message").path("content").asText();

            // The Cerebras API might return markdown block ```json ... ``` even with json_object format
            if (aiResponseContent.startsWith("```json")) {
                aiResponseContent = aiResponseContent.replace("```json", "").replace("```", "").trim();
            }

            JsonNode aiJson = objectMapper.readTree(aiResponseContent);
            
            boolean isValid = aiJson.path("is_valid").asBoolean(false);
            float confidenceScore = (float) aiJson.path("confidence_score").asDouble(0.0);
            String summary = aiJson.path("summary").asText("No summary provided.");

            return new AiVerificationResult(isValid, confidenceScore, summary);

        } catch (Exception e) {
            e.printStackTrace();
            return new AiVerificationResult(false, 0.0f, "AI Verification failed due to an error: " + e.getMessage());
        }
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
