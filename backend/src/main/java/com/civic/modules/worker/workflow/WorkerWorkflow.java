package com.civic.modules.worker.workflow;

import com.civic.modules.worker.entity.Worker;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Worker availability workflow state machine.
 * Manages worker status transitions.
 */
@Component
public class WorkerWorkflow {

    /**
     * Check if a transition from currentStatus to newStatus is valid.
     */
    public boolean isValidTransition(String currentStatus, String newStatus) {
        try {
            WorkerStatus current = WorkerStatus.fromValue(currentStatus);
            WorkerStatus next = WorkerStatus.fromValue(newStatus);
            
            Set<WorkerStatus> validNextStates = getValidNextStates(current);
            return validNextStates.contains(next);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Get valid next states for a given current status.
     */
    private Set<WorkerStatus> getValidNextStates(WorkerStatus currentStatus) {
        Set<WorkerStatus> validStates = new HashSet<>();
        
        switch (currentStatus) {
            case ACTIVE:
                validStates.add(WorkerStatus.ON_LEAVE);      // Worker takes leave
                validStates.add(WorkerStatus.INACTIVE);      // Worker becomes inactive
                validStates.add(WorkerStatus.SUSPENDED);     // Admin suspends
                break;
            case ON_LEAVE:
                validStates.add(WorkerStatus.ACTIVE);        // Worker returns from leave
                validStates.add(WorkerStatus.INACTIVE);      // Extends to inactive
                break;
            case INACTIVE:
                validStates.add(WorkerStatus.ACTIVE);        // Reactivate worker
                validStates.add(WorkerStatus.SUSPENDED);     // Admin suspends
                break;
            case SUSPENDED:
                validStates.add(WorkerStatus.INACTIVE);      // After suspension, becomes inactive
                break;
        }
        
        return validStates;
    }

    /**
     * Apply status transition to worker.
     */
    public void applyTransition(Worker worker, String newStatus) {
        if (!isValidTransition(worker.getStatus(), newStatus)) {
            throw new IllegalStateException(
                "Invalid worker status transition from " + worker.getStatus() + " to " + newStatus
            );
        }
        
        worker.setStatus(newStatus);
        worker.setUpdatedAt(LocalDateTime.now());
        worker.setLastActiveAt(LocalDateTime.now());
    }

    /**
     * Check if worker is available for assignments.
     */
    public boolean isAvailableForAssignment(String status) {
        return status.equals(WorkerStatus.ACTIVE.getValue());
    }

    /**
     * Get workflow description.
     */
    public String getWorkflowDescription() {
        return "ACTIVE ↔ ON_LEAVE ↔ INACTIVE\n" +
               "ACTIVE → SUSPENDED → INACTIVE\n" +
               "INACTIVE → ACTIVE";
    }
}
