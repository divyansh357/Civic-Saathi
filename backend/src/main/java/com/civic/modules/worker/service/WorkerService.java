package com.civic.modules.worker.service;

import com.civic.modules.worker.dto.WorkerResponse;
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
        Optional<Worker> worker = workerRepository.findById(id);
        if (worker.isPresent()) {
            return workerMapper.toResponse(worker.get());
        }
        throw new RuntimeException("Worker not found with ID: " + id);
    }

    /**
     * Get workers by department.
     */
    public Page<WorkerResponse> getWorkersByDepartment(String departmentId, Pageable pageable) {
        return workerRepository.findByDepartmentId(departmentId, pageable)
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
     * Increment complaints assigned to worker.
     */
    public void incrementComplaintsAssigned(String workerId) {
        Optional<Worker> workerOptional = workerRepository.findById(workerId);
        if (workerOptional.isPresent()) {
            Worker worker = workerOptional.get();
            worker.setComplaintsAssigned(worker.getComplaintsAssigned() + 1);
            workerRepository.save(worker);
        }
    }

    /**
     * Delete a worker.
     */
    public void deleteWorker(String id) {
        if (!workerRepository.existsById(id)) {
            throw new RuntimeException("Worker not found with ID: " + id);
        }
        workerRepository.deleteById(id);
    }
}
