package com.civic.modules.worker.workflow;

/**
 * Worker availability and status workflow states.
 */
public enum WorkerStatus {
    ACTIVE("ACTIVE"),           // Available for assignments
    ON_LEAVE("ON_LEAVE"),       // On temporary leave
    INACTIVE("INACTIVE"),       // Not available
    SUSPENDED("SUSPENDED");     // Account suspended

    private final String value;

    WorkerStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static WorkerStatus fromValue(String value) {
        for (WorkerStatus status : WorkerStatus.values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid worker status: " + value);
    }
}
