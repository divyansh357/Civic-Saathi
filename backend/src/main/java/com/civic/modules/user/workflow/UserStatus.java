package com.civic.modules.user.workflow;

/**
 * User account status workflow states.
 */
public enum UserStatus {
    PENDING("PENDING"),           // Email not verified
    VERIFIED("VERIFIED"),         // Email verified, account active
    SUSPENDED("SUSPENDED"),       // Account suspended (policy violation)
    DEACTIVATED("DEACTIVATED");   // User-initiated deactivation

    private final String value;

    UserStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static UserStatus fromValue(String value) {
        for (UserStatus status : UserStatus.values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid user status: " + value);
    }
}
