package com.civic.infrastructure.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class OpenRouterVisionClient {

    private static final Logger log = LoggerFactory.getLogger(OpenRouterVisionClient.class);
    private static final String API_URL = "https://openrouter.ai/api/v1/chat/completions";

    @Value("${ai.openrouter.api-key:}")
    private String apiKey;

    @Value("${ai.openrouter.vision-model:google/gemma-4-26b-a4b-it}")
    private String visionModel;

    @Value("${ai.openrouter.fallback-model:nemotron-nano-12b-v2-vl}")
    private String fallbackModel;

    @Value("${ai.openrouter.max-tokens:512}")
    private int maxTokens;

    private final RestTemplate restTemplate = new RestTemplate();

    public OpenRouterVisionClient() {
    }

    public String analyzeImages(String prompt, List<String> imageUrls) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("OPENROUTER_API_KEY is missing. Skipping Vision API call.");
            return "{\"isValid\": true, \"confidence\": 1.0, \"reason\": \"No API Key\"}";
        }
        if (imageUrls == null || imageUrls.isEmpty()) {
            return "{\"isValid\": true, \"confidence\": 1.0, \"reason\": \"No images provided\"}";
        }

        try {
            return executeRequest(prompt, imageUrls, visionModel);
        } catch (HttpClientErrorException.TooManyRequests e) {
            log.error("OpenRouter Vision API Rate Limit Exceeded (429)");
            throw new RateLimitException("OpenRouter API rate limit exceeded");
        } catch (Exception e) {
            log.warn("Primary OpenRouter Vision model ({}) failed: {}. Attempting fallback to {}", visionModel, e.getMessage(), fallbackModel);
            try {
                return executeRequest(prompt, imageUrls, fallbackModel);
            } catch (Exception ex) {
                log.error("Fallback OpenRouter Vision API also failed: {}", ex.getMessage());
                // Fail secure (reject) on API error
                return "{\"isValid\": false, \"confidence\": 0.0, \"reason\": \"API Error Fallback\"}";
            }
        }
    }

    private String executeRequest(String prompt, List<String> imageUrls, String model) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        List<Map<String, Object>> contentList = new ArrayList<>();
        
        // Add the text prompt
        Map<String, Object> textContent = new HashMap<>();
        textContent.put("type", "text");
        textContent.put("text", prompt);
        contentList.add(textContent);

        // Add up to 5 images
        int limit = Math.min(imageUrls.size(), 5);
        for (int i = 0; i < limit; i++) {
            Map<String, Object> imageContent = new HashMap<>();
            imageContent.put("type", "image_url");
            Map<String, String> urlMap = new HashMap<>();
            urlMap.put("url", imageUrls.get(i));
            imageContent.put("image_url", urlMap);
            contentList.add(imageContent);
        }

        Map<String, Object> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", contentList);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(userMessage));
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("temperature", 0.1);
        
        // Ensure response is JSON
        Map<String, Object> responseFormat = new HashMap<>();
        responseFormat.put("type", "json_object");
        requestBody.put("response_format", responseFormat);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(API_URL, entity, Map.class);
        Map<String, Object> body = response.getBody();
        if (body != null && body.containsKey("choices")) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        }
        return null;
    }
    
    public static class RateLimitException extends RuntimeException {
        public RateLimitException(String message) {
            super(message);
        }
    }
}
