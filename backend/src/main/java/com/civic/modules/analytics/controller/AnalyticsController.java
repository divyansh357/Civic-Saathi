package com.civic.modules.analytics.controller;

import com.civic.modules.analytics.dto.AnalyticsDashboardResponse;
import com.civic.modules.analytics.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for analytics and reporting endpoints.
 */
@RestController
@RequestMapping("/api/v1/analytics")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    /**
     * Get dashboard metrics.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsDashboardResponse> getDashboardMetrics() {
        AnalyticsDashboardResponse metrics = analyticsService.getDashboardMetrics();
        return ResponseEntity.ok(metrics);
    }

    /**
     * Get complaints by category.
     */
    @GetMapping("/complaints/category")
    public ResponseEntity<?> getComplaintsByCategory() {
        Object result = analyticsService.getComplaintsByCategory();
        return ResponseEntity.ok(result);
    }

    /**
     * Get department performance.
     */
    @GetMapping("/departments/performance")
    public ResponseEntity<?> getDepartmentPerformance() {
        Object result = analyticsService.getDepartmentPerformance();
        return ResponseEntity.ok(result);
    }

    /**
     * Get resolution time analytics.
     */
    @GetMapping("/resolution-time")
    public ResponseEntity<?> getResolutionTimeAnalytics() {
        Object result = analyticsService.getResolutionTimeAnalytics();
        return ResponseEntity.ok(result);
    }
}
