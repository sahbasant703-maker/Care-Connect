package com.healthcare.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Medical Record related DTOs.
 */
public class MedicalRecordDTOs {

    /**
     * Create medical record request DTO (Doctor).
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateMedicalRecordRequest {
        @NotNull(message = "Appointment ID is required")
        private Long appointmentId;

        @NotBlank(message = "Diagnosis is required")
        @Size(max = 2000, message = "Diagnosis must not exceed 2000 characters")
        private String diagnosis;

        @NotBlank(message = "Prescription is required")
        @Size(max = 3000, message = "Prescription must not exceed 3000 characters")
        private String prescription;

        @Size(max = 2000, message = "Notes must not exceed 2000 characters")
        private String notes;

        private String followUpDate;
    }

    /**
     * Medical record response DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MedicalRecordResponse {
        private Long id;
        private Long doctorId;
        private String doctorName;
        private Long patientId;
        private String patientName;
        private Long appointmentId;
        private String diagnosis;
        private String prescription;
        private String notes;
        private String followUpDate;
        private String createdAt;
    }

    /**
     * Medical record list item response DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MedicalRecordListItemResponse {
        private Long id;
        private String doctorName;
        private String patientName;
        private String diagnosis;
        private String createdAt;
    }
}