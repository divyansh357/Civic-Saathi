package com.civic.modules.analytics.service;

import com.civic.modules.analytics.dto.AnalyticsDashboardResponse;
import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.complaint.repository.ComplaintRepository;
import com.civic.modules.department.repository.DepartmentRepository;
import com.civic.modules.worker.repository.WorkerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for analytics and reporting.
 * Provides real data-driven metrics for the dashboard.
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

    /**
     * Get dashboard analytics with real data.
     */
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

        // Average resolution time
        Double avgHours = complaintRepository.avgResolutionHours();
        response.setAverageResolutionTime(avgHours != null ? Math.round(avgHours * 10.0) / 10.0 : 0.0);

        // SLA breach rate
        long slaBreached = complaintRepository.countSlaBreachedComplaints(LocalDateTime.now());
        double slaBreachRate = total > 0 ? Math.round((slaBreached * 100.0 / total) * 10.0) / 10.0 : 0.0;
        response.setSlaBreachRate(slaBreachRate);

        // Counts
        response.setDepartments(departmentRepository.count());
        response.setWorkers(workerRepository.count());

        // Complaints by status map
        Map<String, Long> byStatus = new LinkedHashMap<>();
        List<Object[]> statusCounts = complaintRepository.countGroupedByStatus();
        for (Object[] row : statusCounts) {
            byStatus.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        response.setComplaintsByStatus(byStatus);

        // Complaints by department map
        Map<String, Long> byDept = new LinkedHashMap<>();
        List<Object[]> deptCounts = complaintRepository.countGroupedByDepartment();
        for (Object[] row : deptCounts) {
            byDept.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        response.setComplaintsByDepartment(byDept);

        return response;
    }

    /**
     * Get complaints grouped by category.
     */
    public Map<String, Long> getComplaintsByCategory() {
        Map<String, Long> result = new LinkedHashMap<>();
        List<Object[]> rows = complaintRepository.countGroupedByDepartment();
        for (Object[] row : rows) {
            result.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        return result;
    }

    /**
     * Get department performance metrics.
     */
    public List<Map<String, Object>> getDepartmentPerformance() {
        List<Object[]> rows = complaintRepository.countGroupedByDepartment();
        return rows.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("department", row[0]);
            m.put("total", row[1]);
            return m;
        }).toList();
    }

    /**
     * Get resolution time analytics.
     */
    public Map<String, Object> getResolutionTimeAnalytics() {
        Map<String, Object> result = new HashMap<>();
        Double avg = complaintRepository.avgResolutionHours();
        result.put("averageResolutionHours", avg != null ? avg : 0.0);
        result.put("totalResolved", complaintRepository.countByStatus(Complaint.ComplaintStatus.RESOLVED));
        result.put("slaBreached", complaintRepository.countSlaBreachedComplaints(LocalDateTime.now()));
        return result;
    }

    /**
     * Get complaint volume for a date range (for trend charts).
     */
    public Map<String, Object> getComplaintVolume(LocalDateTime from, LocalDateTime to) {
        Map<String, Object> result = new HashMap<>();
        result.put("total", complaintRepository.countByCreatedAtBetween(from, to));
        result.put("from", from);
        result.put("to", to);
        return result;
    }
}
