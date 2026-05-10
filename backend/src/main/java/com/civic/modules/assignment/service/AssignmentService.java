package com.civic.modules.assignment.service;

import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.complaint.repository.ComplaintRepository;
import com.civic.modules.department.entity.Department;
import com.civic.modules.department.repository.DepartmentRepository;
import com.civic.modules.worker.entity.Worker;
import com.civic.modules.worker.repository.WorkerRepository;
import com.civic.modules.assignment.dto.AssignmentRequest;
import com.civic.modules.assignment.dto.AssignmentResponse;
import com.civic.modules.assignment.dto.AutoAssignmentRequest;
import com.civic.modules.assignment.entity.Assignment;
import com.civic.modules.assignment.repository.AssignmentRepository;
import com.civic.modules.assignment.mapper.AssignmentMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing complaint assignments and routing.
 */
@Service
@Transactional
public class AssignmentService {

    private static final Logger logger = LoggerFactory.getLogger(AssignmentService.class);

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private AssignmentMapper assignmentMapper;

    /**
     * Auto-assign complaint to appropriate department and worker.
     */
    public AssignmentResponse autoAssignComplaint(AutoAssignmentRequest request) {
        logger.info("Auto-assigning complaint {} with category {}", request.getComplaintId(), request.getCategory());

        Complaint complaint = complaintRepository.findById(request.getComplaintId())
                .orElseThrow(() -> new RuntimeException("Complaint not found with ID: " + request.getComplaintId()));

        // Find appropriate department based on category
        Department department = findDepartmentByCategory(request.getCategory(), request.getCity());
        if (department == null) {
            throw new RuntimeException("No department found for category: " + request.getCategory());
        }

        // Find best available worker in the department
        Worker assignedWorker = findBestAvailableWorker(department.getId(), request.getLatitude(), request.getLongitude());

        // Create assignment
        Assignment assignment = new Assignment();
        assignment.setComplaint(complaint);
        assignment.setDepartment(department);
        assignment.setAssignedWorker(assignedWorker);
        assignment.setAssignmentType("AUTO");
        assignment.setStatus("ASSIGNED");
        assignment.setPriority(request.getPriority() != null ? request.getPriority() : 3);
        assignment.setCreatedAt(LocalDateTime.now());
        assignment.setUpdatedAt(LocalDateTime.now());

        // Set SLA deadline based on priority
        assignment.setSlaDeadline(calculateSlaDeadline(assignment.getPriority()));

        Assignment savedAssignment = assignmentRepository.save(assignment);

        // Update complaint status and assignment
        complaint.setStatus("ASSIGNED");
        complaint.setDepartment(department);
        complaint.setAssignedWorker(assignedWorker);
        complaint.setUpdatedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        // Update worker statistics
        if (assignedWorker != null) {
            assignedWorker.setComplaintsAssigned(assignedWorker.getComplaintsAssigned() + 1);
            assignedWorker.setLastActiveAt(LocalDateTime.now());
            workerRepository.save(assignedWorker);
        }

        logger.info("Successfully auto-assigned complaint {} to department {} and worker {}", 
                complaint.getId(), department.getId(), assignedWorker != null ? assignedWorker.getId() : "none");

        return assignmentMapper.toResponse(savedAssignment);
    }

    /**
     * Manually assign complaint to specific worker.
     */
    public AssignmentResponse manualAssignComplaint(AssignmentRequest request) {
        logger.info("Manually assigning complaint {} to worker {}", request.getComplaintId(), request.getWorkerId());

        Complaint complaint = complaintRepository.findById(request.getComplaintId())
                .orElseThrow(() -> new RuntimeException("Complaint not found with ID: " + request.getComplaintId()));

        Worker worker = workerRepository.findById(request.getWorkerId())
                .orElseThrow(() -> new RuntimeException("Worker not found with ID: " + request.getWorkerId()));

        // Create assignment
        Assignment assignment = new Assignment();
        assignment.setComplaint(complaint);
        assignment.setDepartment(worker.getDepartment());
        assignment.setAssignedWorker(worker);
        assignment.setAssignmentType("MANUAL");
        assignment.setStatus("ASSIGNED");
        assignment.setPriority(request.getPriority() != null ? request.getPriority() : complaint.getPriority());
        assignment.setNotes(request.getNotes());
        assignment.setCreatedAt(LocalDateTime.now());
        assignment.setUpdatedAt(LocalDateTime.now());

        // Set SLA deadline
        assignment.setSlaDeadline(calculateSlaDeadline(assignment.getPriority()));

        Assignment savedAssignment = assignmentRepository.save(assignment);

        // Update complaint
        complaint.setStatus("ASSIGNED");
        complaint.setDepartment(worker.getDepartment());
        complaint.setAssignedWorker(worker);
        complaint.setUpdatedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        // Update worker statistics
        worker.setComplaintsAssigned(worker.getComplaintsAssigned() + 1);
        worker.setLastActiveAt(LocalDateTime.now());
        workerRepository.save(worker);

        logger.info("Successfully manually assigned complaint {} to worker {}", complaint.getId(), worker.getId());

        return assignmentMapper.toResponse(savedAssignment);
    }

    /**
     * Reassign complaint to different worker.
     */
    public AssignmentResponse reassignComplaint(String assignmentId, String newWorkerId, String reason) {
        logger.info("Reassigning assignment {} to worker {} with reason: {}", assignmentId, newWorkerId, reason);

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID: " + assignmentId));

        Worker newWorker = workerRepository.findById(newWorkerId)
                .orElseThrow(() -> new RuntimeException("Worker not found with ID: " + newWorkerId));

        // Update old worker statistics
        Worker oldWorker = assignment.getAssignedWorker();
        if (oldWorker != null) {
            oldWorker.setComplaintsAssigned(Math.max(0, oldWorker.getComplaintsAssigned() - 1));
            workerRepository.save(oldWorker);
        }

        // Update assignment
        assignment.setAssignedWorker(newWorker);
        assignment.setDepartment(newWorker.getDepartment());
        assignment.setStatus("REASSIGNED");
        assignment.setNotes(assignment.getNotes() + "\nReassigned: " + reason);
        assignment.setUpdatedAt(LocalDateTime.now());

        Assignment savedAssignment = assignmentRepository.save(assignment);

        // Update complaint
        Complaint complaint = assignment.getComplaint();
        complaint.setAssignedWorker(newWorker);
        complaint.setDepartment(newWorker.getDepartment());
        complaint.setStatus("ASSIGNED");
        complaint.setUpdatedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        // Update new worker statistics
        newWorker.setComplaintsAssigned(newWorker.getComplaintsAssigned() + 1);
        newWorker.setLastActiveAt(LocalDateTime.now());
        workerRepository.save(newWorker);

        logger.info("Successfully reassigned assignment {} to worker {}", assignmentId, newWorkerId);

        return assignmentMapper.toResponse(savedAssignment);
    }

    /**
     * Get assignments by department.
     */
    public Page<AssignmentResponse> getAssignmentsByDepartment(String departmentId, Pageable pageable) {
        return assignmentRepository.findByDepartmentId(departmentId, pageable)
                .map(assignmentMapper::toResponse);
    }

    /**
     * Get assignments by worker.
     */
    public Page<AssignmentResponse> getAssignmentsByWorker(String workerId, Pageable pageable) {
        return assignmentRepository.findByAssignedWorkerId(workerId, pageable)
                .map(assignmentMapper::toResponse);
    }

    /**
     * Get overdue assignments (past SLA deadline).
     */
    public List<AssignmentResponse> getOverdueAssignments() {
        LocalDateTime now = LocalDateTime.now();
        return assignmentRepository.findOverdueAssignments(now).stream()
                .map(assignmentMapper::toResponse)
                .toList();
    }

    /**
     * Escalate overdue assignments.
     */
    @Transactional
    public void escalateOverdueAssignments() {
        logger.info("Starting escalation process for overdue assignments");

        List<Assignment> overdueAssignments = assignmentRepository.findOverdueAssignments(LocalDateTime.now());
        
        for (Assignment assignment : overdueAssignments) {
            if (!"ESCALATED".equals(assignment.getStatus())) {
                assignment.setStatus("ESCALATED");
                assignment.setPriority(Math.min(5, assignment.getPriority() + 1)); // Increase priority
                assignment.setNotes(assignment.getNotes() + "\nEscalated due to SLA breach at " + LocalDateTime.now());
                assignment.setUpdatedAt(LocalDateTime.now());
                
                // Update complaint status
                Complaint complaint = assignment.getComplaint();
                complaint.setStatus("ESCALATED");
                complaint.setPriority(assignment.getPriority());
                complaint.setUpdatedAt(LocalDateTime.now());
                
                assignmentRepository.save(assignment);
                complaintRepository.save(complaint);
                
                logger.warn("Escalated assignment {} for complaint {} due to SLA breach", 
                        assignment.getId(), complaint.getId());
            }
        }

        logger.info("Completed escalation process. Escalated {} assignments", overdueAssignments.size());
    }

    /**
     * Find department by category and city.
     */
    private Department findDepartmentByCategory(String category, String city) {
        // First try to find department by exact category match
        Optional<Department> department = departmentRepository.findByCategoryTypeAndCity(category, city);
        
        if (department.isPresent()) {
            return department.get();
        }

        // Fallback to any active department in the city
        List<Department> departments = departmentRepository.findByActiveAndCity(true, city);
        if (!departments.isEmpty()) {
            return departments.get(0); // Return first available department
        }

        return null;
    }

    /**
     * Find best available worker based on workload and proximity.
     */
    private Worker findBestAvailableWorker(String departmentId, Double latitude, Double longitude) {
        List<Worker> availableWorkers = workerRepository.findAvailableWorkersByDepartment(departmentId);
        
        if (availableWorkers.isEmpty()) {
            return null;
        }

        // Simple workload balancing - find worker with least assignments
        Worker bestWorker = availableWorkers.get(0);
        int minAssignments = bestWorker.getComplaintsAssigned();

        for (Worker worker : availableWorkers) {
            if (worker.getComplaintsAssigned() < minAssignments) {
                bestWorker = worker;
                minAssignments = worker.getComplaintsAssigned();
            }
        }

        return bestWorker;
    }

    /**
     * Calculate SLA deadline based on priority.
     */
    private LocalDateTime calculateSlaDeadline(Integer priority) {
        LocalDateTime now = LocalDateTime.now();
        
        return switch (priority) {
            case 5 -> now.plusHours(4);   // Critical - 4 hours
            case 4 -> now.plusHours(12);  // High - 12 hours
            case 3 -> now.plusDays(2);    // Medium - 2 days
            case 2 -> now.plusDays(5);    // Low - 5 days
            case 1 -> now.plusDays(10);   // Very Low - 10 days
            default -> now.plusDays(3);   // Default - 3 days
        };
    }
}