package com.civic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main Spring Boot application entry point for Civic Saathi.
 * A citizen-government complaint resolution platform.
 */
@SpringBootApplication
@EnableScheduling
public class CivicApplication {

	public static void main(String[] args) {
		SpringApplication.run(CivicApplication.class, args);
	}
}
