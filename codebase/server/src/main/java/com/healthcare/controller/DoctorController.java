package com.healthcare.controller;

import com.healthcare.dto.ApiResponse;
import com.healthcare.dto.AppointmentDTOs;
import com.healthcare.dto.DoctorDTOs;
import com.healthcare.dto.MedicalRecordDTOs;
import com.healthcare.dto.PatientDTOs;
import com.healthcare.service.DoctorService;
import com.healthcare.service.MedicalRecordService;
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

import java.util.List;

/**
 * Controller for doctor-facing operations: appointments, profile, medical records.
 */
@RestController
@RequestMapping("/doctor")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor", description = "Doctor-facing endpoints for appointments and medical records")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorController {

    private final DoctorService doctorService;
    private final MedicalRecordService medicalRecordService;

    /**
     * Get doctor's own profile.
     *
     * @param userDetails authenticated user
     * @return doctor profile
     */
    @GetMapping("/profile")
    @Operation(summary = "Get my profile", description = "Retrieve the authenticated doctor's profile")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
                    content = @Content(schema = @Schema(implementation = DoctorDTOs.DoctorResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Doctor role required")
    })
    public ResponseEntity<ApiResponse<DoctorDTOs.DoctorResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Fetching profile for doctor: {}", userDetails.getUsername());
        DoctorDTOs.DoctorResponse profile = doctorService.getMyProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    /**
     * Get doctor's appointments with pagination.
     *
     * @param userDetails authenticated user
     * @param pageable pagination info
     * @return page of appointments
     */
    @GetMapping("/appointments")
    @Operation(summary = "Get my appointments", description = "Retrieve paginated list of doctor's appointments")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Appointments retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Doctor role required")
    })
    public ResponseEntity<ApiResponse<Page<AppointmentDTOs.AppointmentResponse>>> getMyAppointments(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Fetching appointments for doctor: {}", userDetails.getUsername());
        Page<AppointmentDTOs.AppointmentResponse> appointments =
                doctorService.getMyAppointments(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Appointments retrieved successfully", appointments));
    }

    /**
     * Get doctor's upcoming appointments.
     *
     * @param userDetails authenticated user
     * @return list of upcoming appointments
     */
    @GetMapping("/appointments/upcoming")
    @Operation(summary = "Get upcoming appointments", description = "Retrieve upcoming appointments (today onward)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Upcoming appointments retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<ApiResponse<List<AppointmentDTOs.AppointmentResponse>>> getUpcomingAppointments(
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Fetching upcoming appointments for doctor: {}", userDetails.getUsername());
        List<AppointmentDTOs.AppointmentResponse> appointments =
                doctorService.getUpcomingAppointments(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Upcoming appointments retrieved", appointments));
    }

    /**
     * Update appointment status (confirm, complete, cancel, no-show).
     *
     * @param appointmentId appointment ID
     * @param request status and optional notes
     * @param userDetails authenticated user
     * @return updated appointment
     */
    @PutMapping("/appointments/{appointmentId}")
    @Operation(summary = "Update appointment status", description = "Update appointment status and add doctor notes")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Appointment updated successfully",
                    content = @Content(schema = @Schema(implementation = AppointmentDTOs.AppointmentResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or not your appointment"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Doctor role required")
    })
    public ResponseEntity<ApiResponse<AppointmentDTOs.AppointmentResponse>> updateAppointmentStatus(
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentDTOs.UpdateAppointmentStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Updating appointment {} for doctor: {}", appointmentId, userDetails.getUsername());
        AppointmentDTOs.AppointmentResponse appointment = doctorService.updateAppointmentStatus(
                userDetails.getUsername(), appointmentId, request.getStatus(), request.getDoctorNotes());
        return ResponseEntity.ok(ApiResponse.success("Appointment updated successfully", appointment));
    }

    /**
     * Toggle doctor's availability.
     *
     * @param userDetails authenticated user
     * @return updated doctor profile
     */
    @PutMapping("/availability")
    @Operation(summary = "Toggle availability", description = "Toggle the doctor's availability for new bookings")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Availability toggled successfully",
                    content = @Content(schema = @Schema(implementation = DoctorDTOs.DoctorResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Doctor role required")
    })
    public ResponseEntity<ApiResponse<DoctorDTOs.DoctorResponse>> toggleAvailability(
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Toggling availability for doctor: {}", userDetails.getUsername());
        DoctorDTOs.DoctorResponse doctor = doctorService.toggleAvailability(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Availability updated successfully", doctor));
    }

    /**
     * Get patient details (only if patient has appointments with this doctor).
     *
     * @param patientId patient ID
     * @param userDetails authenticated user
     * @return patient profile
     */
    @GetMapping("/patients/{patientId}")
    @Operation(summary = "Get patient details", description = "Retrieve a patient's profile (only if they have appointments with this doctor)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Patient retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Patient not found or no appointment history"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Doctor role required")
    })
    public ResponseEntity<ApiResponse<PatientDTOs.PatientProfileResponse>> getPatientDetails(
            @PathVariable Long patientId,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Doctor {} fetching patient details for ID: {}", userDetails.getUsername(), patientId);
        PatientDTOs.PatientProfileResponse patient = doctorService.getPatientDetails(userDetails.getUsername(), patientId);
        return ResponseEntity.ok(ApiResponse.success("Patient retrieved successfully", patient));
    }

    /**
     * Create a medical record for a patient.
     *
     * @param request medical record details
     * @param userDetails authenticated user
     * @return created medical record
     */
    @PostMapping("/medical-records")
    @Operation(summary = "Create medical record", description = "Create a medical record for a patient")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Medical record created successfully",
                    content = @Content(schema = @Schema(implementation = MedicalRecordDTOs.MedicalRecordResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or appointment not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Doctor role required")
    })
    public ResponseEntity<ApiResponse<MedicalRecordDTOs.MedicalRecordResponse>> createMedicalRecord(
            @Valid @RequestBody MedicalRecordDTOs.CreateMedicalRecordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Doctor {} creating medical record", userDetails.getUsername());
        MedicalRecordDTOs.MedicalRecordResponse record = medicalRecordService.createMedicalRecord(
                userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Medical record created successfully", record));
    }

    /**
     * Get medical records created by this doctor.
     *
     * @param userDetails authenticated user
     * @param pageable pagination info
     * @return page of medical records
     */
    @GetMapping("/medical-records")
    @Operation(summary = "Get my medical records", description = "Retrieve paginated list of medical records created by this doctor")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Medical records retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Doctor role required")
    })
    public ResponseEntity<ApiResponse<Page<MedicalRecordDTOs.MedicalRecordResponse>>> getMyMedicalRecords(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Fetching medical records for doctor: {}", userDetails.getUsername());
        Page<MedicalRecordDTOs.MedicalRecordResponse> records = medicalRecordService.getMyRecords(
                userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Medical records retrieved successfully", records));
    }
}