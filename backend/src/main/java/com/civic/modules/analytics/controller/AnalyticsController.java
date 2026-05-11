package com.civic.modules.analytics.controller;

import com.civic.modules.analytics.dto.AnalyticsDashboardResponse;
import com.civic.modules.analytics.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for analytics and reporting endpoints.
 */
@RestController
@RequestMapping("/api/v1/analytics")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    /** Get dashboard metrics with AI insights. */
    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsDashboardResponse> getDashboardMetrics() {
        return ResponseEntity.ok(analyticsService.getDashboardMetrics());
    }

    /** Get complaints grouped by category. */
    @GetMapping("/complaints/category")
    public ResponseEntity<Map<String, Long>> getComplaintsByCategory() {
        return ResponseEntity.ok(analyticsService.getComplaintsByCategory());
    }

    /** Get department performance with ranking. */
    @GetMapping("/departments/performance")
    public ResponseEntity<List<Map<String, Object>>> getDepartmentPerformance() {
        return ResponseEntity.ok(analyticsService.getDepartmentPerformance());
    }

    /** Get resolution time analytics. */
    @GetMapping("/resolution-time")
    public ResponseEntity<Map<String, Object>> getResolutionTimeAnalytics() {
        return ResponseEntity.ok(analyticsService.getResolutionTimeAnalytics());
    }

    /** Get heatmap data for geographic complaint distribution. */
    @GetMapping("/heatmap")
    public ResponseEntity<List<Map<String, Object>>> getHeatmapData() {
        return ResponseEntity.ok(analyticsService.getHeatmapData());
    }

    /** Get department performance ranking. */
    @GetMapping("/departments/ranking")
    public ResponseEntity<List<Map<String, Object>>> getDepartmentRanking() {
        return ResponseEntity.ok(analyticsService.getDepartmentPerformance());
    }
}
