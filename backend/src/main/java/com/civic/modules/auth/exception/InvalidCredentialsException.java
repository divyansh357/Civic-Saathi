package com.civic.modules.auth.exception;

/**
 * Thrown when user credentials are invalid.
 */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}