package com.healthcare.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Authentication related DTOs.
 */
public class AuthDTOs {

    /**
     * Login request DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
    }

    /**
     * Patient registration request DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterPatientRequest {
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must not exceed 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        @NotBlank(message = "Date of birth is required")
        private String dateOfBirth;

        @NotBlank(message = "Gender is required")
        private String gender;

        @NotBlank(message = "Phone is required")
        @Size(max = 20, message = "Phone must not exceed 20 characters")
        private String phone;

        private String address;
        private String emergencyContactName;
        private String emergencyContactPhone;
        private String bloodGroup;
        private String allergies;
    }

    /**
     * Login response DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginResponse {
        private String accessToken;
        private String refreshToken;
        private UserInfo user;
    }

    /**
     * User info DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private Long id;
        private String name;
        private String email;
        private String role;
    }

    /**
     * Doctor registration request DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterDoctorRequest {
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
     * Token refresh request DTO.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }
}