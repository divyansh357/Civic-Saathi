package com.civic.modules.complaint.workflow;

import com.civic.modules.complaint.entity.Complaint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;

/**
 * Complaint workflow state machine.
 * Manages valid state transitions and enforces business rules for the full lifecycle.
 */
@Component
public class ComplaintWorkflow {

    private static final Logger logger = LoggerFactory.getLogger(ComplaintWorkflow.class);

    /**
     * Check if a transition from currentStatus to newStatus is valid.
     */
    public boolean isValidTransition(String currentStatus, String newStatus) {
        try {
            Complaint.ComplaintStatus current = Complaint.ComplaintStatus.valueOf(currentStatus.toUpperCase());
            Complaint.ComplaintStatus next = Complaint.ComplaintStatus.valueOf(newStatus.toUpperCase());
            return getValidNextStates(current).contains(next);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Get valid next states for a given current status.
     * Full lifecycle: SUBMITTED → DUPLICATE_CHECKED → VERIFIED → ROUTED → ASSIGNED
     *                 → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → VERIFIED_FOR_CLOSURE → CLOSED
     * Side paths: any active state → ESCALATED, CLOSED → REOPENED → VERIFIED
     */
    private Set<Complaint.ComplaintStatus> getValidNextStates(Complaint.ComplaintStatus current) {
        switch (current) {
            case SUBMITTED:
                return EnumSet.of(
                    Complaint.ComplaintStatus.DUPLICATE_CHECKED,
                    Complaint.ComplaintStatus.VERIFIED,
                    Complaint.ComplaintStatus.REJECTED,
                    Complaint.ComplaintStatus.ESCALATED
                );
            case DUPLICATE_CHECKED:
                return EnumSet.of(
                    Complaint.ComplaintStatus.VERIFIED,
                    Complaint.ComplaintStatus.REJECTED
                );
            case VERIFIED:
                return EnumSet.of(
                    Complaint.ComplaintStatus.ROUTED,
                    Complaint.ComplaintStatus.ASSIGNED,
                    Complaint.ComplaintStatus.ESCALATED,
                    Complaint.ComplaintStatus.REJECTED
                );
            case ROUTED:
                return EnumSet.of(
                    Complaint.ComplaintStatus.ASSIGNED,
                    Complaint.ComplaintStatus.ESCALATED
                );
            case ASSIGNED:
                return EnumSet.of(
                    Complaint.ComplaintStatus.ACKNOWLEDGED,
                    Complaint.ComplaintStatus.IN_PROGRESS,
                    Complaint.ComplaintStatus.ESCALATED,
                    Complaint.ComplaintStatus.REJECTED
                );
            case ACKNOWLEDGED:
                return EnumSet.of(
                    Complaint.ComplaintStatus.IN_PROGRESS,
                    Complaint.ComplaintStatus.ESCALATED
                );
            case IN_PROGRESS:
                return EnumSet.of(
                    Complaint.ComplaintStatus.RESOLVED,
                    Complaint.ComplaintStatus.ESCALATED
                );
            case RESOLVED:
                return EnumSet.of(
                    Complaint.ComplaintStatus.VERIFIED_FOR_CLOSURE,
                    Complaint.ComplaintStatus.CLOSED,
                    Complaint.ComplaintStatus.REOPENED
                );
            case VERIFIED_FOR_CLOSURE:
                return EnumSet.of(
                    Complaint.ComplaintStatus.CLOSED,
                    Complaint.ComplaintStatus.REOPENED
                );
            case ESCALATED:
                return EnumSet.of(
                    Complaint.ComplaintStatus.ASSIGNED,
                    Complaint.ComplaintStatus.IN_PROGRESS,
                    Complaint.ComplaintStatus.RESOLVED
                );
            case REOPENED:
                return EnumSet.of(
                    Complaint.ComplaintStatus.VERIFIED,
                    Complaint.ComplaintStatus.ASSIGNED,
                    Complaint.ComplaintStatus.ESCALATED
                );
            case REJECTED:
                return EnumSet.of(
                    Complaint.ComplaintStatus.SUBMITTED,
                    Complaint.ComplaintStatus.VERIFIED
                );
            case AI_REJECTED:
                return EnumSet.of(
                    Complaint.ComplaintStatus.VERIFIED,
                    Complaint.ComplaintStatus.REJECTED
                );
            case CLOSED:
            case CANCELLED:
                // Terminal states — no further transitions
                return EnumSet.noneOf(Complaint.ComplaintStatus.class);
            default:
                return EnumSet.noneOf(Complaint.ComplaintStatus.class);
        }
    }

    /**
     * Apply status transition to complaint with full validation.
     */
    public void applyTransition(Complaint complaint, String newStatus) {
        Complaint.ComplaintStatus currentStatus = complaint.getStatus();
        Complaint.ComplaintStatus targetStatus;
        try {
            targetStatus = Complaint.ComplaintStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown complaint status: " + newStatus);
        }

        if (!getValidNextStates(currentStatus).contains(targetStatus)) {
            throw new IllegalStateException(
                "Invalid complaint status transition from " + currentStatus + " to " + targetStatus
            );
        }

        complaint.setStatus(targetStatus);
        complaint.setUpdatedAt(LocalDateTime.now());

        logger.info("Complaint {} transitioned: {} → {}", complaint.getId(), currentStatus, targetStatus);
    }

    /**
     * Force-set status without workflow validation (admin override).
     */
    public void forceTransition(Complaint complaint, String newStatus) {
        Complaint.ComplaintStatus targetStatus = Complaint.ComplaintStatus.valueOf(newStatus.toUpperCase());
        Complaint.ComplaintStatus oldStatus = complaint.getStatus();
        complaint.setStatus(targetStatus);
        complaint.setUpdatedAt(LocalDateTime.now());
        logger.warn("Complaint {} force-transitioned: {} → {} (admin override)", complaint.getId(), oldStatus, targetStatus);
    }

    /**
     * Check if complaint is in a terminal state.
     */
    public boolean isTerminalState(Complaint.ComplaintStatus status) {
        return status == Complaint.ComplaintStatus.CLOSED || status == Complaint.ComplaintStatus.CANCELLED;
    }

    /**
     * Check if complaint can be escalated from its current state.
     */
    public boolean canEscalate(Complaint.ComplaintStatus status) {
        return getValidNextStates(status).contains(Complaint.ComplaintStatus.ESCALATED);
    }

    /**
     * Check if complaint can be reopened.
     */
    public boolean canReopen(Complaint.ComplaintStatus status) {
        return status == Complaint.ComplaintStatus.CLOSED
            || status == Complaint.ComplaintStatus.RESOLVED
            || status == Complaint.ComplaintStatus.VERIFIED_FOR_CLOSURE;
    }
}
