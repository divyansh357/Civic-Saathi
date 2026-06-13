package com.civic.modules.worker.service;

import com.civic.modules.worker.dto.WorkerResponse;
import com.civic.modules.worker.dto.WorkerProfileUpdateRequest;
import com.civic.modules.worker.entity.Worker;
import com.civic.modules.worker.mapper.WorkerMapper;
import com.civic.modules.worker.repository.WorkerRepository;
import com.civic.modules.user.repository.UserRepository;
import com.civic.modules.department.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.UUID;

/**
 * Service for worker management.
 */
@Service
@Transactional
public class WorkerService {

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private WorkerMapper workerMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    /**
     * Get worker by ID.
     */
    public WorkerResponse getWorkerById(String id) {
        Optional<Worker> worker = workerRepository.findById(UUID.fromString(id));
        if (worker.isPresent()) {
            return workerMapper.toResponse(worker.get());
        }
        throw new RuntimeException("Worker not found with ID: " + id);
    }

    /**
     * Get worker by User ID.
     */
    public WorkerResponse getWorkerByUserId(String userId) {
        Optional<Worker> worker = workerRepository.findByUserId(UUID.fromString(userId));
        if (worker.isPresent()) {
            return workerMapper.toResponse(worker.get());
        }
        throw new RuntimeException("Worker not found for User ID: " + userId);
    }

    /**
     * Get all workers.
     */
    public Page<WorkerResponse> getAllWorkers(Pageable pageable) {
        return workerRepository.findAll(pageable)
                .map(workerMapper::toResponse);
    }

    /**
     * Get workers by department.
     */
    public Page<WorkerResponse> getWorkersByDepartment(String departmentId, Pageable pageable) {
        return workerRepository.findByDepartmentId(UUID.fromString(departmentId), pageable)
                .map(workerMapper::toResponse);
    }

    /**
     * Get workers by status.
     */
    public Page<WorkerResponse> getWorkersByStatus(String status, Pageable pageable) {
        return workerRepository.findByStatus(status, pageable)
                .map(workerMapper::toResponse);
    }

    /**
     * Create a new worker.
     */
    public WorkerResponse createWorker(Worker worker) {
        worker.setCreatedAt(LocalDateTime.now());
        worker.setUpdatedAt(LocalDateTime.now());
        Worker savedWorker = workerRepository.save(worker);
        return workerMapper.toResponse(savedWorker);
    }

    /**
     * Update an existing worker.
     */
    public WorkerResponse updateWorker(String id, Worker updates) {
        Worker worker = workerRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new RuntimeException("Worker not found: " + id));
        if (updates.getDesignation() != null) worker.setDesignation(updates.getDesignation());
        if (updates.getSpecialization() != null) worker.setSpecialization(updates.getSpecialization());
        worker.setUpdatedAt(LocalDateTime.now());
        return workerMapper.toResponse(workerRepository.save(worker));
    }

    /**
     * Toggle worker availability (ACTIVE ↔ INACTIVE).
     */
    public WorkerResponse toggleAvailability(String id) {
        Worker worker = workerRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new RuntimeException("Worker not found: " + id));
        String newStatus = "ACTIVE".equals(worker.getStatus()) ? "INACTIVE" : "ACTIVE";
        worker.setStatus(newStatus);
        worker.setUpdatedAt(LocalDateTime.now());
        return workerMapper.toResponse(workerRepository.save(worker));
    }

    /**
     * Increment complaints assigned to worker.
     */
    public void incrementComplaintsAssigned(String workerId) {
        Optional<Worker> workerOptional = workerRepository.findById(UUID.fromString(workerId));
        if (workerOptional.isPresent()) {
            Worker worker = workerOptional.get();
            worker.setComplaintsAssigned(worker.getComplaintsAssigned() + 1);
            workerRepository.save(worker);
        }
    }

    /**
     * Update Aadhar number for worker (mocked verification).
     */
    public WorkerResponse updateAadhar(String id, String aadharNo) {
        Worker worker = workerRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new RuntimeException("Worker not found: " + id));
        worker.setAadharNo(aadharNo);
        // Mock verification: if 12 digits, it's verified
        if (aadharNo != null && aadharNo.matches("\\d{12}")) {
            worker.setIsAadharVerified(true);
        } else {
            worker.setIsAadharVerified(false);
        }
        worker.setUpdatedAt(LocalDateTime.now());
        return workerMapper.toResponse(workerRepository.save(worker));
    }

    /**
     * Update worker profile.
     */
    public WorkerResponse updateProfile(String id, WorkerProfileUpdateRequest request) {
        Worker worker = workerRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new RuntimeException("Worker not found: " + id));
            
        if (request.getAddress() != null) worker.setAddress(request.getAddress());
        if (request.getAadharNo() != null) worker.setAadharNo(request.getAadharNo());
        if (request.getWorkerCode() != null) worker.setWorkerCode(request.getWorkerCode());
        if (request.getProfileImageUrl() != null) worker.setProfileImageUrl(request.getProfileImageUrl());
        if (request.getPreviousWorks() != null) worker.setPreviousWorks(request.getPreviousWorks());
        
        if (request.getDepartmentId() != null && !request.getDepartmentId().isBlank()) {
            departmentRepository.findById(UUID.fromString(request.getDepartmentId()))
                .ifPresent(dept -> {
                    worker.setDepartment(dept);
                    if (worker.getUser() != null) {
                        worker.getUser().setDepartmentCode(dept.getId().toString());
                    }
                });
        }
        
        if (request.getPreferredZoneIds() != null) {
            // Update preferred zones if necessary. (omitted full mapping to Zone entity for brevity unless required)
            // Assuming Zone mapping logic or just skipping for now.
        }

        worker.setUpdatedAt(LocalDateTime.now());
        return workerMapper.toResponse(workerRepository.save(worker));
    }

    /**
     * Delete a worker.
     */
    public void deleteWorker(String id) {
        UUID uuid = UUID.fromString(id);
        if (!workerRepository.existsById(uuid)) {
            throw new RuntimeException("Worker not found with ID: " + id);
        }
        workerRepository.deleteById(uuid);
    }
}
