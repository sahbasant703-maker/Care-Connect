package com.healthcare.service;

import com.healthcare.dto.AuthDTOs;
import com.healthcare.entity.Doctor;
import com.healthcare.entity.Patient;
import com.healthcare.entity.User;
import com.healthcare.repository.DoctorRepository;
import com.healthcare.repository.PatientRepository;
import com.healthcare.repository.UserRepository;
import com.healthcare.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.UUID;

/**
 * Service for authentication operations: login, registration, token refresh.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    private static final String UPLOAD_DIR = "uploads/certifications";

    /**
     * Authenticate user and generate JWT tokens.
     *
     * @param request login request with email and password
     * @return login response with tokens and user info
     */
    @Transactional
    public AuthDTOs.LoginResponse login(AuthDTOs.LoginRequest request) {
        log.debug("Attempting login for email: {}", request.getEmail());

        // Authenticate with Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Load user details
        UserDetails userDetails = loadUserByEmail(request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Generate tokens
        String accessToken = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        // Build response
        AuthDTOs.UserInfo userInfo = AuthDTOs.UserInfo.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();

        log.info("User logged in successfully: {}", request.getEmail());
        return AuthDTOs.LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userInfo)
                .build();
    }

    /**
     * Register a new patient.
     *
     * @param request registration request
     * @return login response with tokens and user info
     */
    @Transactional
    public AuthDTOs.LoginResponse registerPatient(AuthDTOs.RegisterPatientRequest request) {
        log.debug("Registering new patient: {}", request.getEmail());

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Create user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.PATIENT)
                .build();
        user = userRepository.save(user);

        // Create patient profile
        Patient patient = Patient.builder()
                .user(user)
                .dateOfBirth(java.time.LocalDate.parse(request.getDateOfBirth()))
                .gender(Patient.Gender.valueOf(request.getGender().toUpperCase()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .bloodGroup(request.getBloodGroup())
                .allergies(request.getAllergies())
                .build();
        patientRepository.save(patient);

        // Generate tokens for auto-login after registration
        UserDetails userDetails = loadUserByEmail(request.getEmail());
        String accessToken = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        AuthDTOs.UserInfo userInfo = AuthDTOs.UserInfo.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();

        log.info("Patient registered successfully: {}", request.getEmail());
        return AuthDTOs.LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userInfo)
                .build();
    }

    /**
     * Register a new doctor (pending admin approval).
     * Optionally accepts a certification file upload (PDF/JPG/PNG, max 5MB).
     *
     * @param request registration request
     * @param certification optional certification file
     * @return login response with tokens and user info
     */
    @Transactional
    public AuthDTOs.LoginResponse registerDoctor(AuthDTOs.RegisterDoctorRequest request, MultipartFile certification) {
        log.debug("Registering new doctor: {}", request.getEmail());

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Create user with DOCTOR role
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.DOCTOR)
                .build();
        user = userRepository.save(user);

        // Save certification file if provided
        String certPath = null;
        if (certification != null && !certification.isEmpty()) {
            certPath = saveCertification(certification);
        }

        // Create doctor profile with PENDING status (default)
        Doctor doctor = Doctor.builder()
                .user(user)
                .specialization(request.getSpecialization())
                .experience(request.getExperience())
                .bio(request.getBio())
                .consultationFee(request.getConsultationFee())
                .certificationPath(certPath)
                .gender(request.getGender() != null ? request.getGender().toUpperCase() : "MALE")
                .build();
        doctorRepository.save(doctor);

        // Generate tokens for auto-login after registration (but login will fail until approved)
        UserDetails userDetails = loadUserByEmail(request.getEmail());
        String accessToken = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        AuthDTOs.UserInfo userInfo = AuthDTOs.UserInfo.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();

        log.info("Doctor registered successfully (pending approval): {}", request.getEmail());
        return AuthDTOs.LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userInfo)
                .build();
    }

    /**
     * Refresh access token using refresh token.
     *
     * @param request refresh token request
     * @return new login response with fresh tokens
     */
    @Transactional
    public AuthDTOs.LoginResponse refreshToken(AuthDTOs.RefreshTokenRequest request) {
        log.debug("Refreshing token");

        if (!jwtUtil.validateToken(request.getRefreshToken())) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        String email = jwtUtil.extractUsername(request.getRefreshToken());
        UserDetails userDetails = loadUserByEmail(email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String newAccessToken = jwtUtil.generateToken(userDetails);
        String newRefreshToken = jwtUtil.generateRefreshToken(userDetails);

        AuthDTOs.UserInfo userInfo = AuthDTOs.UserInfo.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();

        return AuthDTOs.LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(userInfo)
                .build();
    }

    /**
     * Save an uploaded certification file to the uploads directory.
     * Validates file type (PDF/JPG/PNG) and generates a unique filename.
     *
     * @param file uploaded certification file
     * @return relative path to the saved file
     */
    private String saveCertification(MultipartFile file) {
        // Validate content type
        String contentType = file.getContentType();
        if (!Arrays.asList("application/pdf", "image/jpeg", "image/png").contains(contentType)) {
            throw new IllegalArgumentException("Only PDF, JPG, and PNG files are allowed");
        }

        // Validate file size (already limited by spring.servlet.multipart config, but double-check)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must not exceed 5MB");
        }

        try {
            Path uploadDir = Paths.get(UPLOAD_DIR);
            Files.createDirectories(uploadDir);

            String extension = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + extension;
            Path filePath = uploadDir.resolve(filename);
            file.transferTo(filePath);

            log.info("Saved certification file: {}", filePath);
            return "/uploads/certifications/" + filename;
        } catch (IOException e) {
            log.error("Failed to save certification file", e);
            throw new IllegalArgumentException("Failed to save certification file");
        }
    }

    /**
     * Extract file extension from filename.
     *
     * @param filename original filename
     * @return file extension including dot (e.g., ".pdf")
     */
    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * Load UserDetails by email.
     *
     * @param email user email
     * @return UserDetails
     */
    private UserDetails loadUserByEmail(String email) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(email)
                .password(userRepository.findByEmail(email).orElseThrow().getPassword())
                .authorities(java.util.Collections.singletonList(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_" + userRepository.findByEmail(email).orElseThrow().getRole().name()
                        )
                ))
                .build();
    }
}