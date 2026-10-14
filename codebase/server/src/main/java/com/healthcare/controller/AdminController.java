package com.healthcare.controller;

import com.healthcare.dto.ApiResponse;
import com.healthcare.dto.AppointmentDTOs;
import com.healthcare.dto.DoctorDTOs;
import com.healthcare.dto.PatientDTOs;
import com.healthcare.entity.Doctor;
import com.healthcare.service.DoctorService;
import com.healthcare.service.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Admin controller for managing doctors, patients, and appointments.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin", description = "Admin-only management operations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final DoctorService doctorService;
    private final PatientService patientService;

    /**
     * Get all doctors with pagination.
     *
     * @param pageable pagination info
     * @return page of doctors
     */
    @GetMapping("/doctors")
    @Operation(summary = "Get all doctors", description = "Retrieve paginated list of all doctors")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Doctors retrieved successfully",
                    content = @Content(schema = @Schema(implementation = DoctorDTOs.DoctorResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin access required")
    })
    public ResponseEntity<ApiResponse<Page<DoctorDTOs.DoctorResponse>>> getAllDoctors(
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Admin fetching all doctors");
        Page<DoctorDTOs.DoctorResponse> doctors = doctorService.getAllDoctors(pageable);
        return ResponseEntity.ok(ApiResponse.success("Doctors retrieved successfully", doctors));
    }

    /**
     * Get pending doctors for approval.
     *
     * @param pageable pagination info
     * @return page of pending doctors
     */
    @GetMapping("/doctors/pending")
    @Operation(summary = "Get pending doctors", description = "Retrieve paginated list of doctors pending approval")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Pending doctors retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin access required")
    })
    public ResponseEntity<ApiResponse<Page<DoctorDTOs.DoctorResponse>>> getPendingDoctors(
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Admin fetching pending doctors");
        Page<DoctorDTOs.DoctorResponse> doctors = doctorService.getPendingDoctors(pageable);
        return ResponseEntity.ok(ApiResponse.success("Pending doctors retrieved successfully", doctors));
    }

    /**
     * Get doctor by ID.
     *
     * @param id doctor ID
     * @return doctor details
     */
    @GetMapping("/doctors/{id}")
    @Operation(summary = "Get doctor by ID", description = "Retrieve detailed information about a specific doctor")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Doctor retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Doctor not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin access required")
    })
    public ResponseEntity<ApiResponse<DoctorDTOs.DoctorResponse>> getDoctorById(@PathVariable Long id) {
        log.info("Admin fetching doctor by ID: {}", id);
        DoctorDTOs.DoctorResponse doctor = doctorService.getDoctorById(id);
        return ResponseEntity.ok(ApiResponse.success("Doctor retrieved successfully", doctor));
    }

    /**
     * Approve a doctor.
     *
     * @param id doctor ID
     * @return approved doctor details
     */
    @PutMapping("/doctors/{id}/approve")
    @Operation(summary = "Approve doctor", description = "Approve a pending doctor account")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Doctor approved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Doctor not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin access required")
    })
    public ResponseEntity<ApiResponse<DoctorDTOs.DoctorResponse>> approveDoctor(@PathVariable Long id) {
        log.info("Admin approving doctor ID: {}", id);
        DoctorDTOs.DoctorResponse doctor = doctorService.updateDoctorStatus(id, Doctor.Status.APPROVED);
        return ResponseEntity.ok(ApiResponse.success("Doctor approved successfully", doctor));
    }

    /**
     * Reject a doctor.
     *
     * @param id doctor ID
     * @return success message
     */
    @PutMapping("/doctors/{id}/reject")
    @Operation(summary = "Reject doctor", description = "Reject a pending doctor account and remove it")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Doctor rejected and removed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Doctor not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin access required")
    })
    public ResponseEntity<ApiResponse<Void>> rejectDoctor(@PathVariable Long id) {
        log.info("Admin rejecting doctor ID: {}", id);
        doctorService.updateDoctorStatus(id, Doctor.Status.REJECTED);
        return ResponseEntity.ok(ApiResponse.success("Doctor rejected and removed successfully"));
    }

    /**
     * Create a doctor account (admin bypasses approval workflow).
     *
     * @param request doctor details
     * @return created doctor response
     */
    @PostMapping("/doctors")
    @Operation(summary = "Create doctor", description = "Admin creates a doctor account directly (auto-approved)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Doctor created successfully",
                    content = @Content(schema = @Schema(implementation = DoctorDTOs.DoctorResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or email already exists"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin access required")
    })
    public ResponseEntity<ApiResponse<DoctorDTOs.DoctorResponse>> createDoctor(
            @Valid @RequestBody DoctorDTOs.CreateDoctorRequest request) {
        log.info("Admin creating doctor: {}", request.getEmail());
        DoctorDTOs.DoctorResponse doctor = doctorService.createDoctor(request);
        return ResponseEntity.ok(ApiResponse.success("Doctor created successfully", doctor));
    }

    /**
     * Get all patients with pagination.
     *
     * @param pageable pagination info
     * @return page of patients
     */
    @GetMapping("/patients")
    @Operation(summary = "Get all patients", description = "Retrieve paginated list of all patients")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Patients retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin access required")
    })
    public ResponseEntity<ApiResponse<Page<PatientDTOs.PatientListItemResponse>>> getAllPatients(
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Admin fetching all patients");
        Page<PatientDTOs.PatientListItemResponse> patients = patientService.getAllPatients(pageable);
        return ResponseEntity.ok(ApiResponse.success("Patients retrieved successfully", patients));
    }

    /**
     * Serve a certification file for admin review.
     *
     * @param filename certification filename
     * @return file resource
     */
    @GetMapping("/certifications/{filename}")
    @Operation(summary = "View certification", description = "Serve a doctor's uploaded certification file")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "File retrieved"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "File not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin access required")
    })
    public ResponseEntity<Resource> getCertification(@PathVariable String filename) {
        Path filePath = Paths.get("uploads/certifications").resolve(filename);
        Resource resource = new FileSystemResource(filePath);

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        // Determine content type from extension
        String contentType = "application/octet-stream";
        if (filename.endsWith(".pdf")) contentType = "application/pdf";
        else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
        else if (filename.endsWith(".png")) contentType = "image/png";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    /**
     * Get all appointments with pagination.
     *
     * @param pageable pagination info
     * @return page of appointments
     */
    @GetMapping("/appointments")
    @Operation(summary = "Get all appointments", description = "Retrieve paginated list of all appointments")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Appointments retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin access required")
    })
    public ResponseEntity<ApiResponse<Page<AppointmentDTOs.AppointmentResponse>>> getAllAppointments(
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Admin fetching all appointments");
        Page<AppointmentDTOs.AppointmentResponse> appointments = patientService.getAllAppointments(pageable);
        return ResponseEntity.ok(ApiResponse.success("Appointments retrieved successfully", appointments));
    }
}