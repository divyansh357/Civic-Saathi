package com.civic.common;

/**
 * Application-wide constants.
 */
public class Constants {

	// API constants
	public static final String API_BASE_PATH = "/api/v1";

	// Authentication constants
	public static final String JWT_TOKEN_HEADER = "Authorization";
	public static final String JWT_TOKEN_PREFIX = "Bearer ";

	// Messages
	public static final String SUCCESS_MESSAGE = "Request processed successfully";
	public static final String ERROR_MESSAGE = "An error occurred while processing the request";

	private Constants() {
		// Utility class
	}
}
