package com.civic.modules.complaint.workflow;

import com.civic.modules.complaint.entity.Complaint;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Complaint workflow state machine.
 * Manages valid state transitions and enforces business rules.
 */
@Component
public class ComplaintWorkflow {

    /**
     * Check if a transition from currentStatus to newStatus is valid.
     */
    public boolean isValidTransition(String currentStatus, String newStatus) {
        ComplaintStatus current = ComplaintStatus.fromValue(currentStatus);
        ComplaintStatus next = ComplaintStatus.fromValue(newStatus);
        
        Set<ComplaintStatus> validNextStates = getValidNextStates(current);
        return validNextStates.contains(next);
    }

    /**
     * Get valid next states for a given current status.
     */
    private Set<ComplaintStatus> getValidNextStates(ComplaintStatus currentStatus) {
        Set<ComplaintStatus> validStates = new HashSet<>();
        
        switch (currentStatus) {
            case OPEN:
                validStates.add(ComplaintStatus.IN_PROGRESS);
                validStates.add(ComplaintStatus.REJECTED);
                break;
            case IN_PROGRESS:
                validStates.add(ComplaintStatus.RESOLVED);
                validStates.add(ComplaintStatus.REJECTED);
                break;
            case RESOLVED:
                validStates.add(ComplaintStatus.CLOSED);
                break;
            case CLOSED:
                // Terminal state - no transitions
                break;
            case REJECTED:
                validStates.add(ComplaintStatus.OPEN);
                break;
        }
        
        return validStates;
    }

    /**
     * Apply status transition to complaint.
     */
    public void applyTransition(Complaint complaint, String newStatus) {
        if (!isValidTransition(complaint.getStatus(), newStatus)) {
            throw new IllegalStateException(
                "Invalid complaint status transition from " + complaint.getStatus() + " to " + newStatus
            );
        }
        
        complaint.setStatus(newStatus);
        complaint.setUpdatedAt(LocalDateTime.now());
        
        // Set resolved timestamp when moving to RESOLVED or CLOSED
        if (newStatus.equals(ComplaintStatus.RESOLVED.getValue()) || newStatus.equals(ComplaintStatus.CLOSED.getValue())) {
            complaint.setResolvedAt(LocalDateTime.now());
        }
    }

    /**
     * Check if complaint is in terminal state.
     */
    public boolean isTerminalState(String status) {
        return status.equals(ComplaintStatus.CLOSED.getValue());
    }

    /**
     * Get workflow description for UI/documentation.
     */
    public String getWorkflowDescription() {
        return "OPEN → IN_PROGRESS → RESOLVED → CLOSED\n" +
               "OPEN → REJECTED → OPEN\n" +
               "IN_PROGRESS → REJECTED → OPEN";
    }
}
