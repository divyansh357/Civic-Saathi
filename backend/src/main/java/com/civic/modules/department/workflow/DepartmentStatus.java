package com.civic.modules.department.workflow;

/**
 * Department operational status workflow states.
 */
public enum DepartmentStatus {
    ACTIVE("ACTIVE"),           // Operational
    CLOSED("CLOSED"),           // Temporarily closed
    MAINTENANCE("MAINTENANCE"), // Under maintenance
    INACTIVE("INACTIVE");       // Decommissioned

    private final String value;

    DepartmentStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static DepartmentStatus fromValue(String value) {
        for (DepartmentStatus status : DepartmentStatus.values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid department status: " + value);
    }
}
