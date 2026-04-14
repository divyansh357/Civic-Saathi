package com.civic.modules.complaint.workflow;

/**
 * Complaint status workflow state machine.
 * Defines valid state transitions for complaints.
 */
public enum ComplaintStatus {
    OPEN("OPEN"),
    IN_PROGRESS("IN_PROGRESS"),
    RESOLVED("RESOLVED"),
    CLOSED("CLOSED"),
    REJECTED("REJECTED");

    private final String value;

    ComplaintStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ComplaintStatus fromValue(String value) {
        for (ComplaintStatus status : ComplaintStatus.values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid complaint status: " + value);
    }
}
