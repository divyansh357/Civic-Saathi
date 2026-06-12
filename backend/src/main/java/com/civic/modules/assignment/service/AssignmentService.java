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
import java.util.UUID;

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
        logger.info("Auto-assigning complaint {}", request.getComplaintId());

        Complaint complaint = complaintRepository.findById(UUID.fromString(request.getComplaintId()))
                .orElseThrow(() -> new RuntimeException("Complaint not found with ID: " + request.getComplaintId()));

        // Derive category from request or complaint
        String category = request.getCategory();
        if (category == null || category.isBlank()) {
            category = complaint.getCategory(); // from first category
        }

        // Derive city from request or complaint
        String cityName = request.getCity();
        if (cityName == null || cityName.isBlank()) {
            cityName = complaint.getCity() != null ? complaint.getCity().getName() : null;
        }

        // Derive lat/lng from request or complaint
        Double lat = request.getLatitude();
        Double lng = request.getLongitude();
        if (lat == null && complaint.getLocation() != null) {
            lat = complaint.getLocation().getY();
            lng = complaint.getLocation().getX();
        }

        // Derive priority from request or complaint
        int priorityVal = 3;
        if (request.getPriority() != null) {
            priorityVal = request.getPriority();
        } else if (complaint.getPriority() != null) {
            try { priorityVal = Integer.parseInt(complaint.getPriority()); }
            catch (NumberFormatException ignored) { /* default 3 */ }
        }

        // Find appropriate department based on category
        Department department = findDepartmentByCategory(category, cityName);
        if (department == null) {
            // Fallback: use complaint's existing department or first available
            department = complaint.getDepartment();
        }
        if (department == null) {
            department = departmentRepository.findAll(org.springframework.data.domain.PageRequest.of(0, 1))
                    .stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("No departments available in the system"));
        }

        // Find best available worker in the department
        Worker assignedWorker = findBestAvailableWorker(department.getUuid(), lat, lng);

        if (assignedWorker == null) {
            logger.info("No available workers in department {}. Complaint {} will remain unassigned (ROUTED).", department.getUuid(), complaint.getId());
            complaint.setStatus(Complaint.ComplaintStatus.ROUTED);
            complaint.setDepartment(department);
            complaint.setUpdatedAt(LocalDateTime.now());
            complaintRepository.save(complaint);
            
            AssignmentResponse response = new AssignmentResponse();
            response.setComplaintId(complaint.getId().toString());
            response.setDepartmentId(department.getId());
            response.setDepartmentName(department.getName());
            return response;
        }

        Assignment assignment = new Assignment();
        assignment.setComplaint(complaint);
        assignment.setWorker(assignedWorker);
        assignment.setAssignedBy(complaint.getCreatedBy()); // Use the citizen as the assigner for auto-assignment to satisfy DB constraint
        assignment.setStatus(Assignment.AssignmentStatus.ASSIGNED);
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setDeadlineAt(calculateSlaDeadline(priorityVal));
        assignment.setIsAutoAssigned(true);

        Assignment savedAssignment = assignmentRepository.save(assignment);

        // Update complaint status and assignment
        complaint.setStatus(Complaint.ComplaintStatus.ASSIGNED);
        complaint.setDepartment(department);
        complaint.setAssignedWorker(assignedWorker);
        complaint.setUpdatedAt(LocalDateTime.now());
        complaint.setSlaDeadline(assignment.getDeadlineAt());
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

        Complaint complaint = complaintRepository.findById(UUID.fromString(request.getComplaintId()))
                .orElseThrow(() -> new RuntimeException("Complaint not found with ID: " + request.getComplaintId()));

        Worker worker = workerRepository.findById(UUID.fromString(request.getWorkerId()))
                .orElseThrow(() -> new RuntimeException("Worker not found with ID: " + request.getWorkerId()));

        // Create assignment
        Assignment assignment = new Assignment();
        assignment.setComplaint(complaint);
        assignment.setWorker(worker);
        // Note: assignedBy should be set to the current user in the controller
        assignment.setStatus(Assignment.AssignmentStatus.ASSIGNED);
        assignment.setAssignedAt(LocalDateTime.now());

        // Set deadline based on request priority or complaint priority
        String priorityStr = request.getPriority() != null ? request.getPriority().toString() : complaint.getPriority();
        int priority = priorityStr != null ? Integer.parseInt(priorityStr) : 3;
        assignment.setDeadlineAt(calculateSlaDeadline(priority));

        Assignment savedAssignment = assignmentRepository.save(assignment);

        // Update complaint
        complaint.setStatus(Complaint.ComplaintStatus.ASSIGNED);
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

        Assignment assignment = assignmentRepository.findById(UUID.fromString(assignmentId))
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID: " + assignmentId));

        Worker newWorker = workerRepository.findById(UUID.fromString(newWorkerId))
                .orElseThrow(() -> new RuntimeException("Worker not found with ID: " + newWorkerId));

        // Update old worker statistics
        Worker oldWorker = assignment.getWorker();
        if (oldWorker != null) {
            oldWorker.setComplaintsAssigned(Math.max(0, oldWorker.getComplaintsAssigned() - 1));
            workerRepository.save(oldWorker);
        }

        // Update assignment
        assignment.setWorker(newWorker);
        assignment.setStatus(Assignment.AssignmentStatus.ASSIGNED); // Reset to assigned status
        assignment.setRejectionReason(reason); // Store reason in rejection reason field
        assignment.setAssignedAt(LocalDateTime.now()); // Update assignment time

        Assignment savedAssignment = assignmentRepository.save(assignment);

        // Update complaint
        Complaint complaint = assignment.getComplaint();
        complaint.setAssignedWorker(newWorker);
        complaint.setDepartment(newWorker.getDepartment());
        complaint.setStatus(Complaint.ComplaintStatus.ASSIGNED);
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
     * Worker acknowledges an assignment.
     */
    public AssignmentResponse acknowledgeAssignment(String assignmentId) {
        Assignment assignment = assignmentRepository.findById(UUID.fromString(assignmentId))
            .orElseThrow(() -> new RuntimeException("Assignment not found: " + assignmentId));
            
        Worker worker = assignment.getWorker();
        if (worker != null && (worker.getAadharNo() == null || worker.getAadharNo().trim().isEmpty())) {
            throw new RuntimeException("Aadhar number is required before accepting a task");
        }
            
        assignment.accept();
        return assignmentMapper.toResponse(assignmentRepository.save(assignment));
    }

    /**
     * Check if a worker is currently available (no active assignments).
     */
    public boolean isWorkerAvailable(String workerId) {
        List<Assignment> activeAssignments = assignmentRepository.findActiveByWorkerId(UUID.fromString(workerId));
        return activeAssignments.isEmpty();
    }

    /**
     * Worker starts working on an assignment.
     */
    public AssignmentResponse startAssignment(String assignmentId) {
        Assignment assignment = assignmentRepository.findById(UUID.fromString(assignmentId))
            .orElseThrow(() -> new RuntimeException("Assignment not found: " + assignmentId));
        assignment.startProgress();
        return assignmentMapper.toResponse(assignmentRepository.save(assignment));
    }

    /**
     * Worker completes an assignment.
     */
    public AssignmentResponse completeAssignment(String assignmentId, String notes, java.util.List<String> images) {
        Assignment assignment = assignmentRepository.findById(UUID.fromString(assignmentId))
            .orElseThrow(() -> new RuntimeException("Assignment not found: " + assignmentId));
        assignment.complete();
        
        if (images != null && !images.isEmpty()) {
            assignment.setCompletionImages(images);
        }

        // Update complaint to VERIFIED_FOR_CLOSURE (Pending Admin Approval)
        Complaint complaint = assignment.getComplaint();
        complaint.setStatus(Complaint.ComplaintStatus.VERIFIED_FOR_CLOSURE);
        complaint.setUpdatedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        // Update worker resolved count
        Worker worker = assignment.getWorker();
        if (worker != null) {
            worker.setComplaintsResolved(worker.getComplaintsResolved() + 1);
            workerRepository.save(worker);
        }

        return assignmentMapper.toResponse(assignmentRepository.save(assignment));
    }

    /**
     * Worker rejects an assignment.
     */
    public AssignmentResponse rejectAssignment(String assignmentId, String reason) {
        Assignment assignment = assignmentRepository.findById(UUID.fromString(assignmentId))
            .orElseThrow(() -> new RuntimeException("Assignment not found: " + assignmentId));
            
        if (!Boolean.TRUE.equals(assignment.getIsAutoAssigned())) {
            throw new RuntimeException("Cannot reject tasks that are assigned manually by an Admin or Ward Head");
        }
        
        assignment.reject(reason);
        return assignmentMapper.toResponse(assignmentRepository.save(assignment));
    }

    /**
     * Get all assignments (paginated).
     */
    @Transactional(readOnly = true)
    public Page<AssignmentResponse> getAllAssignments(Pageable pageable) {
        return assignmentRepository.findAll(pageable).map(assignmentMapper::toResponse);
    }

    /**
     * Get assignments by department.
     */
    public Page<AssignmentResponse> getAssignmentsByDepartment(String departmentId, Pageable pageable) {
        // For now, return all assignments and filter in service layer if needed
        // This can be optimized later with custom repository methods
        return assignmentRepository.findAll(pageable)
                .map(assignmentMapper::toResponse);
    }

    /**
     * Get assignments by worker.
     */
    public Page<AssignmentResponse> getAssignmentsByWorker(String workerId, Pageable pageable) {
        return assignmentRepository.findByWorkerId(UUID.fromString(workerId), pageable)
                .map(assignmentMapper::toResponse);
    }

    /**
     * Get completed assignments by worker.
     */
    public Page<AssignmentResponse> getCompletedAssignmentsByWorker(String workerId, Pageable pageable) {
        return assignmentRepository.findByWorkerIdAndStatus(UUID.fromString(workerId), Assignment.AssignmentStatus.COMPLETED, pageable)
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
            if (assignment.getStatus() != Assignment.AssignmentStatus.CANCELLED) {
                assignment.setStatus(Assignment.AssignmentStatus.CANCELLED); // Mark as cancelled for escalation
                assignment.setRejectionReason("Escalated due to SLA breach at " + LocalDateTime.now());
                
                // Update complaint status
                Complaint complaint = assignment.getComplaint();
                complaint.setStatus(Complaint.ComplaintStatus.ESCALATED);
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
    private Worker findBestAvailableWorker(UUID departmentId, Double latitude, Double longitude) {
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