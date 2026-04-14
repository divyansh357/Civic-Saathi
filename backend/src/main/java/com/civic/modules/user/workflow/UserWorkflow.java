package com.civic.modules.user.workflow;

import com.civic.modules.user.entity.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * User account workflow state machine.
 * Manages user account status transitions.
 */
@Component
public class UserWorkflow {

    /**
     * Check if a transition from currentStatus to newStatus is valid.
     */
    public boolean isValidTransition(String currentStatus, String newStatus) {
        try {
            UserStatus current = UserStatus.fromValue(currentStatus);
            UserStatus next = UserStatus.fromValue(newStatus);
            
            Set<UserStatus> validNextStates = getValidNextStates(current);
            return validNextStates.contains(next);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Get valid next states for a given current status.
     */
    private Set<UserStatus> getValidNextStates(UserStatus currentStatus) {
        Set<UserStatus> validStates = new HashSet<>();
        
        switch (currentStatus) {
            case PENDING:
                validStates.add(UserStatus.VERIFIED);    // Email verified
                validStates.add(UserStatus.DEACTIVATED); // User cancels signup
                break;
            case VERIFIED:
                validStates.add(UserStatus.SUSPENDED);   // Admin suspends
                validStates.add(UserStatus.DEACTIVATED); // User deactivates
                break;
            case SUSPENDED:
                validStates.add(UserStatus.VERIFIED);    // Admin unsuspends
                validStates.add(UserStatus.DEACTIVATED); // Admin deactivates
                break;
            case DEACTIVATED:
                validStates.add(UserStatus.VERIFIED);    // User reactivates
                break;
        }
        
        return validStates;
    }

    /**
     * Apply status transition to user.
     */
    public void applyTransition(User user, String newStatus) {
        if (!isValidTransition(user.getRole(), newStatus)) {
            throw new IllegalStateException(
                "Invalid user status transition from " + user.getRole() + " to " + newStatus
            );
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        
        // Update active flag based on new status
        if (newStatus.equals(UserStatus.VERIFIED.getValue())) {
            user.setActive(true);
            user.setVerified(true);
        } else if (newStatus.equals(UserStatus.SUSPENDED.getValue()) || 
                   newStatus.equals(UserStatus.DEACTIVATED.getValue())) {
            user.setActive(false);
        }
    }

    /**
     * Get workflow description.
     */
    public String getWorkflowDescription() {
        return "PENDING → VERIFIED → (SUSPENDED | DEACTIVATED)\n" +
               "SUSPENDED → VERIFIED | DEACTIVATED\n" +
               "DEACTIVATED → VERIFIED";
    }
}
