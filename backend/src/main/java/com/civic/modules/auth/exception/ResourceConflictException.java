package com.civic.modules.auth.exception;

/**
 * Thrown when a resource uniqueness constraint is violated.
 */
public class ResourceConflictException extends RuntimeException {
    public ResourceConflictException(String message) {
        super(message);
    }
}