package com.healthcare.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Patient related DTOs.
 */
public class PatientDTOs {

    /**
     * Patient profile response DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PatientProfileResponse {
        private Long id;
        private String name;
        private String email;
        private String dateOfBirth;
        private String gender;
        private String phone;
        private String address;
        private String emergencyContactName;
        private String emergencyContactPhone;
        private String bloodGroup;
        private String allergies;
        private String createdAt;
    }

    /**
     * Update patient profile request DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdatePatientProfileRequest {
        @Size(max = 100, message = "Name must not exceed 100 characters")
        private String name;

        @Size(max = 20, message = "Phone must not exceed 20 characters")
        private String phone;

        @Size(max = 500, message = "Address must not exceed 500 characters")
        private String address;

        @Size(max = 100, message = "Emergency contact name must not exceed 100 characters")
        private String emergencyContactName;

        @Size(max = 20, message = "Emergency contact phone must not exceed 20 characters")
        private String emergencyContactPhone;

        @Size(max = 5, message = "Blood group must not exceed 5 characters")
        private String bloodGroup;

        @Size(max = 1000, message = "Allergies must not exceed 1000 characters")
        private String allergies;
    }

    /**
     * Patient list item response DTO (for admin).
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PatientListItemResponse {
        private Long id;
        private String name;
        private String email;
        private String dateOfBirth;
        private String gender;
        private String phone;
        private String createdAt;
    }
}