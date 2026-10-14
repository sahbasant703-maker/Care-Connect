package com.healthcare.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Appointment related DTOs.
 */
public class AppointmentDTOs {

    /**
     * Book appointment request DTO (Patient).
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BookAppointmentRequest {
        @NotNull(message = "Doctor ID is required")
        private Long doctorId;

        @NotBlank(message = "Appointment date is required")
        private String appointmentDate;

        @NotBlank(message = "Appointment time is required")
        private String appointmentTime;

        @Size(max = 1000, message = "Reason for visit must not exceed 1000 characters")
        private String reasonForVisit;
    }

    /**
     * Update appointment status request DTO (Doctor).
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateAppointmentStatusRequest {
        @NotBlank(message = "Status is required")
        private String status;

        @Size(max = 2000, message = "Doctor notes must not exceed 2000 characters")
        private String doctorNotes;
    }

    /**
     * Cancel appointment request DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CancelAppointmentRequest {
        @NotBlank(message = "Cancellation reason is required")
        @Size(max = 500, message = "Cancellation reason must not exceed 500 characters")
        private String cancellationReason;
    }

    /**
     * Appointment response DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AppointmentResponse {
        private Long id;
        private Long doctorId;
        private String doctorName;
        private String doctorSpecialization;
        private String doctorGender;
        private Long patientId;
        private String patientName;
        private String patientGender;
        private String appointmentDate;
        private String appointmentTime;
        private String status;
        private String reasonForVisit;
        private String doctorNotes;
        private String createdAt;
    }

    /**
     * Appointment list item response DTO (for pagination).
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AppointmentListItemResponse {
        private Long id;
        private String doctorName;
        private String doctorSpecialization;
        private String patientName;
        private String appointmentDate;
        private String appointmentTime;
        private String status;
        private String createdAt;
    }
}