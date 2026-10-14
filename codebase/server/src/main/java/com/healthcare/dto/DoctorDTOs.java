package com.healthcare.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Doctor related DTOs.
 */
public class DoctorDTOs {

    /**
     * Create doctor request DTO (Admin only).
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateDoctorRequest {
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must not exceed 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        @NotBlank(message = "Specialization is required")
        @Size(max = 100, message = "Specialization must not exceed 100 characters")
        private String specialization;

        @NotNull(message = "Experience is required")
        @Min(value = 0, message = "Experience cannot be negative")
        @Max(value = 100, message = "Experience must not exceed 100 years")
        private Integer experience;

        @Size(max = 500, message = "Bio must not exceed 500 characters")
        private String bio;

        @DecimalMin(value = "0.0", message = "Consultation fee cannot be negative")
        private Double consultationFee;

        private String gender;
    }

    /**
     * Update doctor request DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateDoctorRequest {
        @Size(max = 100, message = "Specialization must not exceed 100 characters")
        private String specialization;

        @Min(value = 0, message = "Experience cannot be negative")
        @Max(value = 100, message = "Experience must not exceed 100 years")
        private Integer experience;

        @Size(max = 500, message = "Bio must not exceed 500 characters")
        private String bio;

        @DecimalMin(value = "0.0", message = "Consultation fee cannot be negative")
        private Double consultationFee;

        private Boolean isAvailable;
    }

    /**
     * Doctor response DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DoctorResponse {
        private Long id;
        private String name;
        private String email;
        private String specialization;
        private Integer experience;
        private String bio;
        private Double consultationFee;
        private Boolean isAvailable;
        private String status;
        private String certificationPath;
        private String gender;
        private String createdAt;
    }

    /**
     * Doctor schedule slot request DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScheduleSlotRequest {
        @NotBlank(message = "Date is required")
        private String date;

        @NotBlank(message = "Start time is required")
        private String startTime;

        @NotBlank(message = "End time is required")
        private String endTime;
    }

    /**
     * Doctor schedule slot response DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScheduleSlotResponse {
        private Long id;
        private String date;
        private String startTime;
        private String endTime;
        private Boolean isBooked;
    }
}