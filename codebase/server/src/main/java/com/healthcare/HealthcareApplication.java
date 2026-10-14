package com.healthcare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Main entry point for the Online Healthcare Management System backend.
 * <p>
 * This is a Spring Boot monolithic application that provides REST APIs for
 * managing patients, doctors, appointments, and medical records.
 * </p>
 *
 * @author Healthcare Team
 * @version 1.0.0
 * @since 2026-09-20
 */
@SpringBootApplication
@EnableJpaAuditing
public class HealthcareApplication {

    /**
     * Application entry point.
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(HealthcareApplication.class, args);
    }
}