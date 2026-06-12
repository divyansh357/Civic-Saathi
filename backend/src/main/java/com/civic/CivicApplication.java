package com.civic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main Spring Boot application entry point for Civic Saathi.
 * A citizen-government complaint resolution platform.
 */
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;

@SpringBootApplication
@EnableScheduling
public class CivicApplication {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@PostConstruct
	public void fixDatabase() {
		try {
			jdbcTemplate.execute("ALTER TABLE notifications DROP COLUMN IF EXISTS notification_type_id CASCADE");
			System.out.println("Successfully dropped notification_type_id column");
		} catch (Exception e) {
			System.out.println("Could not drop column: " + e.getMessage());
		}
	}

	public static void main(String[] args) {
		SpringApplication.run(CivicApplication.class, args);
	}
}
