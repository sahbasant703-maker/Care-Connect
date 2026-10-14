package com.healthcare.controller;

import com.healthcare.dto.ApiResponse;
import com.healthcare.dto.AuthDTOs;
import com.healthcare.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Authentication controller for login, registration, and token refresh.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Login, registration, and token management")
public class AuthController {

    private final AuthService authService;

    /**
     * User login.
     *
     * @param request login credentials
     * @return JWT tokens and user info
     */
    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticate user and return access/refresh tokens")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(schema = @Schema(implementation = AuthDTOs.LoginResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<ApiResponse<AuthDTOs.LoginResponse>> login(@Valid @RequestBody AuthDTOs.LoginRequest request) {
        log.info("Login request for email: {}", request.getEmail());
        AuthDTOs.LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    /**
     * Patient registration.
     *
     * @param request patient registration details
     * @return JWT tokens and user info
     */
    @PostMapping("/register")
    @Operation(summary = "Register new patient", description = "Create a new patient account and return tokens")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Registration successful",
                    content = @Content(schema = @Schema(implementation = AuthDTOs.LoginResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or email already exists"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email already registered")
    })
    public ResponseEntity<ApiResponse<AuthDTOs.LoginResponse>> register(@Valid @RequestBody AuthDTOs.RegisterPatientRequest request) {
        log.info("Registration request for email: {}", request.getEmail());
        AuthDTOs.LoginResponse response = authService.registerPatient(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    /**
     * Refresh access token.
     *
     * @param request refresh token
     * @return new access and refresh tokens
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Get new access token using refresh token")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token refreshed",
                    content = @Content(schema = @Schema(implementation = AuthDTOs.LoginResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid or expired refresh token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<ApiResponse<AuthDTOs.LoginResponse>> refreshToken(@Valid @RequestBody AuthDTOs.RefreshTokenRequest request) {
        log.debug("Token refresh request");
        AuthDTOs.LoginResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    /**
     * Doctor registration (pending admin approval).
     *
     * @param request doctor registration details
     * @return JWT tokens and user info
     */
    /**
     * Doctor registration (JSON, backward compatible).
     * To also upload a certification file, use POST /auth/register-doctor-upload with multipart/form-data.
     */
    @PostMapping("/register-doctor")
    @Operation(summary = "Register new doctor", description = "Create a new doctor account (pending admin approval)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Registration successful",
                    content = @Content(schema = @Schema(implementation = AuthDTOs.LoginResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or email already exists"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email already registered")
    })
    public ResponseEntity<ApiResponse<AuthDTOs.LoginResponse>> registerDoctorJson(@Valid @RequestBody AuthDTOs.RegisterDoctorRequest request) {
        log.info("Doctor registration request for email: {}", request.getEmail());
        AuthDTOs.LoginResponse response = authService.registerDoctor(request, null);
        return ResponseEntity.ok(ApiResponse.success("Doctor registration successful - pending admin approval", response));
    }

    /**
     * Doctor registration with certification upload (multipart/form-data).
     * Send "data" as a JSON string field and "certification" as a file.
     */
    @PostMapping(value = "/register-doctor", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Register doctor with file upload", description = "Register with multipart/form-data — optional certification file")
    public ResponseEntity<ApiResponse<AuthDTOs.LoginResponse>> registerDoctorMultipart(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "certification", required = false) MultipartFile certification) {
        log.info("Doctor registration request (multipart)");
        AuthDTOs.RegisterDoctorRequest request;
        try {
            request = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(dataJson, AuthDTOs.RegisterDoctorRequest.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid registration data");
        }
        AuthDTOs.LoginResponse response = authService.registerDoctor(request, certification);
        return ResponseEntity.ok(ApiResponse.success("Doctor registration successful - pending admin approval", response));
    }
}