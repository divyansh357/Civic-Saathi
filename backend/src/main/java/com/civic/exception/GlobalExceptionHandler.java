package com.civic.exception;

import com.civic.modules.auth.exception.InactiveUserException;
import com.civic.modules.auth.exception.InvalidCredentialsException;
import com.civic.modules.auth.exception.InvalidTokenException;
import com.civic.modules.auth.exception.ResourceConflictException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Global exception handler for consistent error responses across the application.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(InvalidCredentialsException.class)
	public ResponseEntity<Map<String, Object>> handleInvalidCredentials(
			InvalidCredentialsException ex,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request, null);
	}

	@ExceptionHandler(InactiveUserException.class)
	public ResponseEntity<Map<String, Object>> handleInactiveUser(
			InactiveUserException ex,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request, null);
	}

	@ExceptionHandler(InvalidTokenException.class)
	public ResponseEntity<Map<String, Object>> handleInvalidToken(
			InvalidTokenException ex,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request, null);
	}

	@ExceptionHandler(ResourceConflictException.class)
	public ResponseEntity<Map<String, Object>> handleConflict(
			ResourceConflictException ex,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request, null);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidationError(
			MethodArgumentNotValidException ex,
			HttpServletRequest request) {
		Map<String, Object> details = new LinkedHashMap<>();
		Map<String, String> fieldErrors = new LinkedHashMap<>();

		for (FieldError error : ex.getBindingResult().getFieldErrors()) {
			fieldErrors.put(error.getField(), error.getDefaultMessage());
		}

		details.put("errors", fieldErrors);
		return buildResponse(HttpStatus.BAD_REQUEST, "Validation failed", request, details);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> handleGlobalException(Exception ex, HttpServletRequest request) {
		return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), request, null);
	}

	private ResponseEntity<Map<String, Object>> buildResponse(
			HttpStatus status,
			String message,
			HttpServletRequest request,
			Map<String, Object> details) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("timestamp", LocalDateTime.now());
		body.put("status", status.value());
		body.put("error", status.getReasonPhrase());
		body.put("message", message);
		body.put("path", request.getRequestURI());

		if (details != null && !details.isEmpty()) {
			body.putAll(details);
		}

		return ResponseEntity.status(status).body(body);
	}
}
