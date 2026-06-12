package com.civic.infrastructure.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * HTTP client for the Cerebras LLM API.
 * Falls back gracefully when no API key is configured.
 */
@Component
public class CerebrasClient {

    private static final Logger log = LoggerFactory.getLogger(CerebrasClient.class);
    private static final String BASE_URL = "https://api.cerebras.ai/v1/chat/completions";
    private static final String DEFAULT_MODEL = "gpt-oss-120b";

    @Value("${ai.cerebras.api-key:}")
    private String apiKey;

    @Value("${ai.cerebras.model:" + DEFAULT_MODEL + "}")
    private String model;

    @Value("${ai.cerebras.max-tokens:512}")
    private int maxTokens;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Returns true if a Cerebras API key is configured. */
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Send a prompt to Cerebras and return the text response.
     * Returns null if the API is unavailable or the call fails.
     */
    public String complete(String systemPrompt, String userPrompt) {
        if (!isAvailable()) {
            log.debug("Cerebras API key not configured — skipping LLM call");
            return null;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
                )
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(BASE_URL, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    if (message != null) {
                        return String.valueOf(message.get("content")).trim();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Cerebras API call failed: {}", e.getMessage());
        }
        return null;
    }
}
