package com.civic.modules.analytics.service;

import com.civic.infrastructure.ai.AiService;
import com.civic.modules.analytics.dto.AnalyticsDashboardResponse;
import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.complaint.repository.ComplaintRepository;
import com.civic.modules.department.repository.DepartmentRepository;
import com.civic.modules.worker.repository.WorkerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for analytics and reporting — Level B + Level C.
 */
@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private AiService aiService;

    /** Get dashboard analytics with real data. */
    public AnalyticsDashboardResponse getDashboardMetrics() {
        AnalyticsDashboardResponse response = new AnalyticsDashboardResponse();

        long total = complaintRepository.count();
        long resolved = complaintRepository.countByStatus(Complaint.ComplaintStatus.RESOLVED)
                      + complaintRepository.countByStatus(Complaint.ComplaintStatus.CLOSED);
        long escalated = complaintRepository.countByStatus(Complaint.ComplaintStatus.ESCALATED);
        long open = total - resolved - escalated;

        response.setTotalComplaints(total);
        response.setOpenComplaints(Math.max(0, open));
        response.setResolvedComplaints(resolved);
        response.setEscalatedComplaints(escalated);

        Double avgHours = complaintRepository.avgResolutionHours();
        response.setAverageResolutionTime(avgHours != null ? Math.round(avgHours * 10.0) / 10.0 : 0.0);

        long slaBreached = complaintRepository.countSlaBreachedComplaints(LocalDateTime.now());
        double slaBreachRate = total > 0 ? Math.round((slaBreached * 100.0 / total) * 10.0) / 10.0 : 0.0;
        response.setSlaBreachRate(slaBreachRate);

        response.setDepartments(departmentRepository.count());
        response.setWorkers(workerRepository.count());

        // Complaints by status
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : complaintRepository.countGroupedByStatus()) {
            byStatus.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        response.setComplaintsByStatus(byStatus);

        // Complaints by department
        Map<String, Long> byDept = new LinkedHashMap<>();
        for (Object[] row : complaintRepository.countGroupedByDepartment()) {
            byDept.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        response.setComplaintsByDepartment(byDept);

        // AI-generated insights
        Map<String, Object> metrics = Map.of(
            "totalComplaints", total,
            "escalatedComplaints", escalated,
            "resolvedComplaints", resolved,
            "averageResolutionTime", response.getAverageResolutionTime(),
            "slaBreachRate", slaBreachRate
        );
        response.setAiInsights(aiService.generateDashboardInsights(metrics));

        return response;
    }

    /** Get complaints grouped by category. */
    public Map<String, Long> getComplaintsByCategory() {
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : complaintRepository.countGroupedByDepartment()) {
            result.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        return result;
    }

    /** Get department performance metrics with ranking. */
    public List<Map<String, Object>> getDepartmentPerformance() {
        List<Object[]> rows = complaintRepository.countGroupedByDepartment();
        long totalResolved = complaintRepository.countByStatus(Complaint.ComplaintStatus.RESOLVED);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("department", row[0]);
            m.put("total", row[1]);
            long deptTotal = ((Number) row[1]).longValue();
            double resolutionRate = totalResolved > 0 && deptTotal > 0
                ? Math.min(100.0, Math.round((totalResolved * 100.0 / deptTotal) * 10.0) / 10.0)
                : 0.0;
            m.put("resolutionRate", resolutionRate);
            m.put("performance", resolutionRate >= 90 ? "Excellent" : resolutionRate >= 75 ? "Good" : "Needs Improvement");
            result.add(m);
        }

        // Sort by resolution rate descending (ranking)
        result.sort((a, b) -> Double.compare(
            (Double) b.get("resolutionRate"),
            (Double) a.get("resolutionRate")
        ));

        // Add rank
        for (int i = 0; i < result.size(); i++) {
            result.get(i).put("rank", i + 1);
        }

        return result;
    }

    /** Get resolution time analytics. */
    public Map<String, Object> getResolutionTimeAnalytics() {
        Map<String, Object> result = new LinkedHashMap<>();
        Double avg = complaintRepository.avgResolutionHours();
        result.put("averageResolutionHours", avg != null ? avg : 0.0);
        result.put("totalResolved", complaintRepository.countByStatus(Complaint.ComplaintStatus.RESOLVED));
        result.put("slaBreached", complaintRepository.countSlaBreachedComplaints(LocalDateTime.now()));
        return result;
    }

    /** Get complaint volume for a date range. */
    public Map<String, Object> getComplaintVolume(LocalDateTime from, LocalDateTime to) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", complaintRepository.countByCreatedAtBetween(from, to));
        result.put("from", from);
        result.put("to", to);
        return result;
    }

    /** Get heatmap data — complaints grouped by location (ward/zone). */
    public List<Map<String, Object>> getHeatmapData() {
        // Returns complaint counts per ward for geographic heatmap rendering
        List<Object[]> rows = complaintRepository.countGroupedByDepartment(); // proxy for now
        List<Map<String, Object>> heatmap = new ArrayList<>();
        // Simulated ward-level data until ward-level grouping query is added
        String[] wards = {"Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5",
                          "Ward 6", "Ward 7", "Ward 8", "Ward 9", "Ward 10"};
        Random rng = new Random(42); // deterministic seed for consistent demo data
        for (String ward : wards) {
            heatmap.add(Map.of(
                "ward", ward,
                "count", rng.nextInt(50) + 5,
                "lat", 12.9716 + (rng.nextDouble() - 0.5) * 0.1,
                "lng", 77.5946 + (rng.nextDouble() - 0.5) * 0.1
            ));
        }
        return heatmap;
    }
}
