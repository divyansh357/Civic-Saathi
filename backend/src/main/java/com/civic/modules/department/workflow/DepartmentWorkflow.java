package com.civic.modules.department.workflow;

import com.civic.modules.department.entity.Department;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Department operational workflow state machine.
 * Manages department status transitions.
 */
@Component
public class DepartmentWorkflow {

    /**
     * Check if a transition from currentStatus to newStatus is valid.
     */
    public boolean isValidTransition(boolean currentActive, String newStatus) {
        DepartmentStatus current = currentActive ? DepartmentStatus.ACTIVE : DepartmentStatus.INACTIVE;
        try {
            DepartmentStatus next = DepartmentStatus.fromValue(newStatus);
            Set<DepartmentStatus> validNextStates = getValidNextStates(current);
            return validNextStates.contains(next);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Get valid next states for a given current status.
     */
    private Set<DepartmentStatus> getValidNextStates(DepartmentStatus currentStatus) {
        Set<DepartmentStatus> validStates = new HashSet<>();
        
        switch (currentStatus) {
            case ACTIVE:
                validStates.add(DepartmentStatus.CLOSED);       // Temporary closure
                validStates.add(DepartmentStatus.MAINTENANCE);  // For maintenance
                validStates.add(DepartmentStatus.INACTIVE);     // Decommission
                break;
            case CLOSED:
                validStates.add(DepartmentStatus.ACTIVE);       // Reopen
                validStates.add(DepartmentStatus.MAINTENANCE);  // Shift to maintenance
                break;
            case MAINTENANCE:
                validStates.add(DepartmentStatus.ACTIVE);       // Maintenance complete
                validStates.add(DepartmentStatus.CLOSED);       // Issues found, close
                break;
            case INACTIVE:
                validStates.add(DepartmentStatus.ACTIVE);       // Reactivate
                break;
        }
        
        return validStates;
    }

    /**
     * Apply status transition to department.
     */
    public void applyTransition(Department department, String newStatus) {
        try {
            DepartmentStatus status = DepartmentStatus.fromValue(newStatus);
            DepartmentStatus current = department.isActive() ? 
                DepartmentStatus.ACTIVE : DepartmentStatus.INACTIVE;
            
            if (!getValidNextStates(current).contains(status)) {
                throw new IllegalStateException(
                    "Invalid department status transition from " + current.getValue() + " to " + newStatus
                );
            }
            
            department.setActive(!newStatus.equals(DepartmentStatus.INACTIVE.getValue()));
            department.setUpdatedAt(LocalDateTime.now());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Invalid department status: " + newStatus);
        }
    }

    /**
     * Check if department is accepting complaints.
     */
    public boolean isAcceptingComplaints(String status) {
        return status.equals(DepartmentStatus.ACTIVE.getValue());
    }

    /**
     * Get workflow description.
     */
    public String getWorkflowDescription() {
        return "ACTIVE ↔ CLOSED\n" +
               "ACTIVE → MAINTENANCE → ACTIVE\n" +
               "ACTIVE ↔ INACTIVE";
    }
}
