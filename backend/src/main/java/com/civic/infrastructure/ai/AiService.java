package com.civic.infrastructure.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

/**
 * Core AI service — rule-based classification with optional LLM enhancement via Cerebras.
 * All methods have reliable fallbacks so the system works without an API key.
 */
@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    @Autowired
    private CerebrasClient cerebras;

    // ── Category keyword maps ──────────────────────────────────────────────────

    private static final Map<String, List<String>> CATEGORY_KEYWORDS = new LinkedHashMap<>();
    private static final Map<String, String> CATEGORY_TO_DEPARTMENT = new LinkedHashMap<>();

    static {
        CATEGORY_KEYWORDS.put("ROADS", List.of(
            "pothole", "road", "street", "pavement", "footpath", "crack", "cave-in",
            "speed breaker", "divider", "highway", "lane", "traffic", "signal", "zebra crossing"
        ));
        CATEGORY_KEYWORDS.put("WATER", List.of(
            "water", "pipe", "leak", "supply", "drainage", "sewage", "flood", "overflow",
            "tap", "borewell", "tanker", "contamination", "dirty water", "no water"
        ));
        CATEGORY_KEYWORDS.put("SANITATION", List.of(
            "garbage", "waste", "trash", "litter", "dump", "bin", "sweeping", "cleaning",
            "stench", "smell", "hygiene", "toilet", "open defecation", "drain", "gutter"
        ));
        CATEGORY_KEYWORDS.put("ELECTRICITY", List.of(
            "light", "electricity", "power", "outage", "streetlight", "wire", "pole",
            "transformer", "voltage", "electric", "bulb", "lamp", "dark", "blackout"
        ));
        CATEGORY_KEYWORDS.put("PARKS", List.of(
            "park", "garden", "tree", "bench", "playground", "grass", "plant", "flower",
            "maintenance", "equipment", "swing", "slide", "fountain", "green"
        ));
        CATEGORY_KEYWORDS.put("CONSTRUCTION", List.of(
            "construction", "building", "demolition", "debris", "rubble", "encroachment",
            "illegal", "structure", "wall", "boundary", "excavation"
        ));

        CATEGORY_TO_DEPARTMENT.put("ROADS", "Roads & Infrastructure");
        CATEGORY_TO_DEPARTMENT.put("WATER", "Water Works");
        CATEGORY_TO_DEPARTMENT.put("SANITATION", "Sanitation & Waste");
        CATEGORY_TO_DEPARTMENT.put("ELECTRICITY", "Electricity & Lighting");
        CATEGORY_TO_DEPARTMENT.put("PARKS", "Parks & Gardens");
        CATEGORY_TO_DEPARTMENT.put("CONSTRUCTION", "Building & Construction");
    }

    // ── Priority keyword maps ──────────────────────────────────────────────────

    private static final List<String> CRITICAL_KEYWORDS = List.of(
        "accident", "injury", "death", "collapse", "fire", "explosion", "flood",
        "emergency", "dangerous", "hazard", "electric shock", "gas leak", "sewage overflow"
    );
    private static final List<String> HIGH_KEYWORDS = List.of(
        "no water", "no electricity", "broken", "blocked", "overflow", "pothole",
        "cave-in", "contamination", "stench", "dark road", "unsafe"
    );
    private static final List<String> LOW_KEYWORDS = List.of(
        "minor", "small", "slight", "cosmetic", "paint", "bench", "grass", "tree trimming"
    );

    // ── Public API ─────────────────────────────────────────────────────────────

    /**
     * Classify a complaint into a category with confidence score.
     * Uses rule-based scoring first; enhances with LLM if available.
     */
    public ClassificationResult classifyComplaint(String title, String description) {
        String text = (title + " " + description).toLowerCase();

        // Rule-based scoring
        Map<String, Integer> scores = new LinkedHashMap<>();
        for (Map.Entry<String, List<String>> entry : CATEGORY_KEYWORDS.entrySet()) {
            int score = 0;
            for (String kw : entry.getValue()) {
                if (text.contains(kw)) score += (title.toLowerCase().contains(kw) ? 3 : 1);
            }
            scores.put(entry.getKey(), score);
        }

        String bestCategory = scores.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .filter(e -> e.getValue() > 0)
            .map(Map.Entry::getKey)
            .orElse("OTHER");

        int maxScore = scores.getOrDefault(bestCategory, 0);
        int totalScore = scores.values().stream().mapToInt(Integer::intValue).sum();
        double confidence = totalScore > 0 ? Math.min(0.95, (double) maxScore / totalScore) : 0.5;

        // LLM enhancement
        if (cerebras.isAvailable() && confidence < 0.7) {
            String llmCategory = llmClassify(title, description);
            if (llmCategory != null && CATEGORY_KEYWORDS.containsKey(llmCategory)) {
                bestCategory = llmCategory;
                confidence = 0.85;
            }
        }

        String priority = suggestPriority(title, description);
        String department = CATEGORY_TO_DEPARTMENT.getOrDefault(bestCategory, "General Administration");

        return new ClassificationResult(bestCategory, confidence, priority, department);
    }

    /**
     * Suggest priority based on keyword analysis.
     */
    public String suggestPriority(String title, String description) {
        String text = (title + " " + description).toLowerCase();
        for (String kw : CRITICAL_KEYWORDS) {
            if (text.contains(kw)) return "CRITICAL";
        }
        for (String kw : HIGH_KEYWORDS) {
            if (text.contains(kw)) return "HIGH";
        }
        for (String kw : LOW_KEYWORDS) {
            if (text.contains(kw)) return "LOW";
        }
        return "MEDIUM";
    }

    /**
     * Generate a concise AI summary of a complaint.
     * Uses LLM if available, otherwise produces a structured rule-based summary.
     */
    public String generateSummary(String title, String description, String category, String address) {
        if (cerebras.isAvailable()) {
            String system = "You are a civic complaint summarizer. Produce a 1-2 sentence factual summary " +
                            "of the complaint for government officers. Be concise and professional.";
            String user = String.format("Title: %s\nDescription: %s\nCategory: %s\nLocation: %s",
                title, description, category, address != null ? address : "Not specified");
            String result = cerebras.complete(system, user);
            if (result != null && !result.isBlank()) return result;
        }

        // Rule-based fallback
        String loc = (address != null && !address.isBlank()) ? " at " + address : "";
        String desc = description != null && description.length() > 100
            ? description.substring(0, 100) + "..."
            : description;
        return String.format("[%s] %s%s. %s", category, title, loc, desc != null ? desc : "");
    }

    /**
     * Compute text similarity between two complaint texts (0.0 – 1.0).
     * Uses Jaccard similarity on word tokens — no external dependencies.
     */
    public double computeTextSimilarity(String text1, String text2) {
        Set<String> tokens1 = tokenize(text1);
        Set<String> tokens2 = tokenize(text2);
        if (tokens1.isEmpty() || tokens2.isEmpty()) return 0.0;

        Set<String> intersection = new HashSet<>(tokens1);
        intersection.retainAll(tokens2);

        Set<String> union = new HashSet<>(tokens1);
        union.addAll(tokens2);

        return (double) intersection.size() / union.size();
    }

    /**
     * Generate dashboard insights narrative using LLM or rule-based summary.
     */
    public String generateDashboardInsights(Map<String, Object> metrics) {
        if (cerebras.isAvailable()) {
            String system = "You are a civic analytics assistant. Given complaint metrics, " +
                            "produce 3-4 actionable insights for city administrators. Be specific and data-driven.";
            String user = "Current metrics: " + metrics.toString();
            String result = cerebras.complete(system, user);
            if (result != null && !result.isBlank()) return result;
        }

        // Rule-based fallback
        long total = toLong(metrics.get("totalComplaints"));
        long escalated = toLong(metrics.get("escalatedComplaints"));
        double slaRate = toDouble(metrics.get("slaBreachRate"));
        double avgHours = toDouble(metrics.get("averageResolutionTime"));

        StringBuilder sb = new StringBuilder();
        sb.append("📊 Platform Insights:\n\n");

        if (slaRate > 20) {
            sb.append("⚠️ SLA breach rate is high (").append(slaRate).append("%). ")
              .append("Consider increasing workforce or adjusting SLA thresholds.\n\n");
        } else {
            sb.append("✅ SLA compliance is healthy at ").append(100 - slaRate).append("% adherence.\n\n");
        }

        if (escalated > 0 && total > 0) {
            double escPct = Math.round((escalated * 100.0 / total) * 10.0) / 10.0;
            sb.append("🚨 ").append(escalated).append(" complaints escalated (").append(escPct)
              .append("% of total). Review assignment workflows.\n\n");
        }

        if (avgHours > 0) {
            sb.append("⏱️ Average resolution time: ").append(avgHours).append(" hours. ");
            if (avgHours > 48) sb.append("This exceeds the 48h target — prioritize backlog clearance.\n");
            else sb.append("Within acceptable range.\n");
        }

        return sb.toString();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private String llmClassify(String title, String description) {
        String categories = String.join(", ", CATEGORY_KEYWORDS.keySet());
        String system = "You are a civic complaint classifier. Respond with ONLY one category name from: " + categories + ". No explanation.";
        String user = "Title: " + title + "\nDescription: " + description;
        String result = cerebras.complete(system, user);
        if (result != null) {
            return result.trim().toUpperCase().replaceAll("[^A-Z_]", "");
        }
        return null;
    }

    private Set<String> tokenize(String text) {
        if (text == null) return Collections.emptySet();
        Set<String> tokens = new HashSet<>();
        // Split on non-word chars, filter stop words, min length 3
        Set<String> stopWords = Set.of("the", "and", "for", "are", "was", "has", "not", "but",
            "with", "this", "that", "from", "have", "been", "they", "will", "our", "its");
        for (String token : text.toLowerCase().split("[^a-z0-9]+")) {
            if (token.length() >= 3 && !stopWords.contains(token)) {
                tokens.add(token);
            }
        }
        return tokens;
    }

    private long toLong(Object v) {
        if (v instanceof Number n) return n.longValue();
        return 0L;
    }

    private double toDouble(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        return 0.0;
    }

    // ── Result record ──────────────────────────────────────────────────────────

    public record ClassificationResult(
        String category,
        double confidence,
        String suggestedPriority,
        String suggestedDepartment
    ) {}
}
