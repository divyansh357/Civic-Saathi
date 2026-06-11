package com.civic.modules.worker.controller;

import com.civic.modules.worker.dto.WorkerResponse;
import com.civic.modules.worker.entity.Worker;
import com.civic.modules.worker.service.WorkerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for worker management endpoints.
 */
@RestController
@RequestMapping("/api/v1/workers")
public class WorkerController {

    @Autowired
    private WorkerService workerService;

    /**
     * Get worker by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<WorkerResponse> getWorkerById(@PathVariable String id) {
        WorkerResponse response = workerService.getWorkerById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get workers by department.
     */
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<Page<WorkerResponse>> getWorkersByDepartment(
            @PathVariable String departmentId,
            Pageable pageable) {
        Page<WorkerResponse> workers = workerService.getWorkersByDepartment(departmentId, pageable);
        return ResponseEntity.ok(workers);
    }

    /**
     * Get workers by status.
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<WorkerResponse>> getWorkersByStatus(
            @PathVariable String status,
            Pageable pageable) {
        Page<WorkerResponse> workers = workerService.getWorkersByStatus(status, pageable);
        return ResponseEntity.ok(workers);
    }

    /**
     * Create a new worker.
     */
    @PostMapping
    public ResponseEntity<WorkerResponse> createWorker(@RequestBody Worker worker) {
        WorkerResponse response = workerService.createWorker(worker);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update a worker.
     */
    @PutMapping("/{id}")
    public ResponseEntity<WorkerResponse> updateWorker(
            @PathVariable String id,
            @RequestBody Worker worker) {
        WorkerResponse response = workerService.updateWorker(id, worker);
        return ResponseEntity.ok(response);
    }

    /**
     * Toggle worker availability.
     */
    @PostMapping("/{id}/availability")
    public ResponseEntity<WorkerResponse> toggleAvailability(@PathVariable String id) {
        WorkerResponse response = workerService.toggleAvailability(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a worker.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorker(@PathVariable String id) {
        workerService.deleteWorker(id);
        return ResponseEntity.noContent().build();
    }
}
