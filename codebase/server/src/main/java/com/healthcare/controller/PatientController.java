package com.healthcare.controller;

import com.healthcare.dto.ApiResponse;
import com.healthcare.dto.AppointmentDTOs;
import com.healthcare.dto.DoctorDTOs;
import com.healthcare.dto.MedicalRecordDTOs;
import com.healthcare.dto.PatientDTOs;
import com.healthcare.service.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for patient-facing operations: profile, doctor browsing, appointments.
 */
@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Patient", description = "Patient-facing endpoints for doctors and appointments")
@SecurityRequirement(name = "bearerAuth")
public class PatientController {

    private final PatientService patientService;

    /**
     * Get the authenticated patient's profile.
     *
     * @param userDetails authenticated user
     * @return patient profile
     */
    @GetMapping("/profile")
    @Operation(summary = "Get my profile", description = "Retrieve the authenticated patient's full profile")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
                    content = @Content(schema = @Schema(implementation = PatientDTOs.PatientProfileResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Patient role required")
    })
    public ResponseEntity<ApiResponse<PatientDTOs.PatientProfileResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Fetching profile for patient: {}", userDetails.getUsername());
        PatientDTOs.PatientProfileResponse profile = patientService.getMyProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    /**
     * Get available doctors (approved only).
     *
     * @param pageable pagination info
     * @return page of doctor responses
     */
    @GetMapping("/doctors")
    @Operation(summary = "Get available doctors", description = "Retrieve paginated list of approved doctors")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Doctors retrieved successfully",
                    content = @Content(schema = @Schema(implementation = DoctorDTOs.DoctorResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Patient role required")
    })
    public ResponseEntity<ApiResponse<Page<DoctorDTOs.DoctorResponse>>> getAvailableDoctors(
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Fetching available doctors");
        Page<DoctorDTOs.DoctorResponse> doctors = patientService.getAvailableDoctors(pageable);
        return ResponseEntity.ok(ApiResponse.success("Doctors retrieved successfully", doctors));
    }

    /**
     * Book an appointment with a doctor.
     *
     * @param request appointment booking details
     * @param userDetails authenticated user
     * @return created appointment
     */
    @PostMapping("/appointments")
    @Operation(summary = "Book appointment", description = "Book an appointment with a doctor")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Appointment booked successfully",
                    content = @Content(schema = @Schema(implementation = AppointmentDTOs.AppointmentResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or booking conflict"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Patient role required")
    })
    public ResponseEntity<ApiResponse<AppointmentDTOs.AppointmentResponse>> bookAppointment(
            @Valid @RequestBody AppointmentDTOs.BookAppointmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Booking appointment for patient: {}", userDetails.getUsername());
        AppointmentDTOs.AppointmentResponse appointment =
                patientService.bookAppointment(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Appointment booked successfully", appointment));
    }

    /**
     * Get patient's appointment history.
     *
     * @param userDetails authenticated user
     * @param pageable pagination info
     * @return page of appointments
     */
    @GetMapping("/appointments")
    @Operation(summary = "Get my appointments", description = "Retrieve paginated list of patient's appointments")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Appointments retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Patient role required")
    })
    public ResponseEntity<ApiResponse<Page<AppointmentDTOs.AppointmentResponse>>> getMyAppointments(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Fetching appointments for patient: {}", userDetails.getUsername());
        Page<AppointmentDTOs.AppointmentResponse> appointments =
                patientService.getMyAppointments(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Appointments retrieved successfully", appointments));
    }

    /**
     * Cancel an appointment.
     *
     * @param appointmentId appointment ID
     * @param request cancellation reason
     * @param userDetails authenticated user
     * @return updated appointment
     */
    @PutMapping("/appointments/{appointmentId}/cancel")
    @Operation(summary = "Cancel appointment", description = "Cancel an upcoming appointment")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Appointment cancelled successfully",
                    content = @Content(schema = @Schema(implementation = AppointmentDTOs.AppointmentResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot cancel this appointment"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Patient role required")
    })
    public ResponseEntity<ApiResponse<AppointmentDTOs.AppointmentResponse>> cancelAppointment(
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentDTOs.CancelAppointmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Cancelling appointment {} for patient: {}", appointmentId, userDetails.getUsername());
        AppointmentDTOs.AppointmentResponse appointment =
                patientService.cancelAppointment(userDetails.getUsername(), appointmentId, request);
        return ResponseEntity.ok(ApiResponse.success("Appointment cancelled successfully", appointment));
    }

    /**
     * Reschedule an appointment.
     *
     * @param appointmentId appointment ID
     * @param request new date, time, and optional reason
     * @param userDetails authenticated user
     * @return updated appointment
     */
    @PutMapping("/appointments/{appointmentId}/reschedule")
    @Operation(summary = "Reschedule appointment", description = "Reschedule an appointment to a new date and time")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Appointment rescheduled successfully",
                    content = @Content(schema = @Schema(implementation = AppointmentDTOs.AppointmentResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot reschedule this appointment"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Patient role required")
    })
    public ResponseEntity<ApiResponse<AppointmentDTOs.AppointmentResponse>> rescheduleAppointment(
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentDTOs.BookAppointmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Rescheduling appointment {} for patient: {}", appointmentId, userDetails.getUsername());
        AppointmentDTOs.AppointmentResponse appointment =
                patientService.rescheduleAppointment(userDetails.getUsername(), appointmentId, request);
        return ResponseEntity.ok(ApiResponse.success("Appointment rescheduled successfully", appointment));
    }

    /**
     * Get patient's medical records.
     *
     * @param userDetails authenticated user
     * @param pageable pagination info
     * @return page of medical records
     */
    @GetMapping("/medical-records")
    @Operation(summary = "Get my medical records", description = "Retrieve paginated list of patient's medical records")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Medical records retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Patient role required")
    })
    public ResponseEntity<ApiResponse<Page<MedicalRecordDTOs.MedicalRecordResponse>>> getMyMedicalRecords(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Fetching medical records for patient: {}", userDetails.getUsername());
        Page<MedicalRecordDTOs.MedicalRecordResponse> records =
                patientService.getMyMedicalRecords(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Medical records retrieved successfully", records));
    }
}