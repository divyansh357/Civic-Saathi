package com.civic.modules.auth.exception;

/**
 * Thrown when attempting auth for an inactive user.
 */
public class InactiveUserException extends RuntimeException {
    public InactiveUserException(String message) {
        super(message);
    }
}