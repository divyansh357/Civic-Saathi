package com.civic.modules.auth.exception;

/**
 * Thrown when refresh or access token is invalid.
 */
public class InvalidTokenException extends RuntimeException {
    public InvalidTokenException(String message) {
        super(message);
    }
}