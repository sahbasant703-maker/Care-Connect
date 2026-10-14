package com.healthcare;

import com.healthcare.dto.ApiResponse;
import com.healthcare.dto.AuthDTOs;
import com.healthcare.entity.User;
import com.healthcare.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for the healthcare application.
 * Tests the auth flow and basic endpoints against a real running server.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class HealthcareApplicationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    private String baseUrl() {
        return "http://localhost:" + port + "/api";
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private HttpHeaders headers(String token) {
        HttpHeaders h = headers();
        h.setBearerAuth(token);
        return h;
    }

    /**
     * Test that the application context loads successfully.
     */
    @Test
    void contextLoads() {
        assertNotNull(restTemplate);
    }

    /**
     * Test patient registration and login flow.
     */
    @Test
    void testPatientRegistrationAndLogin() {
        String email = "testuser@example.com";

        // Register
        AuthDTOs.RegisterPatientRequest reg = new AuthDTOs.RegisterPatientRequest();
        reg.setName("Test User");
        reg.setEmail(email);
        reg.setPassword("password123");
        reg.setDateOfBirth("1990-01-01");
        reg.setGender("MALE");
        reg.setPhone("9999999999");

        HttpEntity<AuthDTOs.RegisterPatientRequest> regEntity = new HttpEntity<>(reg, headers());
        ResponseEntity<ApiResponse> regResponse = restTemplate.exchange(
                baseUrl() + "/auth/register", HttpMethod.POST, regEntity, ApiResponse.class);

        assertEquals(HttpStatus.OK, regResponse.getStatusCode());
        assertNotNull(regResponse.getBody());
        assertTrue(regResponse.getBody().isSuccess());

        // Login
        AuthDTOs.LoginRequest login = new AuthDTOs.LoginRequest();
        login.setEmail(email);
        login.setPassword("password123");

        HttpEntity<AuthDTOs.LoginRequest> loginEntity = new HttpEntity<>(login, headers());
        ResponseEntity<ApiResponse> loginResponse = restTemplate.exchange(
                baseUrl() + "/auth/login", HttpMethod.POST, loginEntity, ApiResponse.class);

        assertEquals(HttpStatus.OK, loginResponse.getStatusCode());
        assertNotNull(loginResponse.getBody());
        assertTrue(loginResponse.getBody().isSuccess());

        // Verify token is returned
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) loginResponse.getBody().getData();
        assertNotNull(data.get("accessToken"));
        assertNotNull(data.get("refreshToken"));

        // Verify user is in DB
        assertTrue(userRepository.findByEmail(email).isPresent());
        User user = userRepository.findByEmail(email).get();
        assertEquals("Test User", user.getName());
        assertEquals(User.Role.PATIENT, user.getRole());
    }

    /**
     * Test that accessing protected endpoints without token returns 401.
     */
    @Test
    void testUnauthorizedAccess() {
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                baseUrl() + "/patient/appointments", HttpMethod.GET, new HttpEntity<>(headers()), ApiResponse.class);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    /**
     * Test that accessing admin endpoints as patient returns 403.
     */
    @Test
    void testForbiddenAccess() {
        // Register a patient and get token
        AuthDTOs.RegisterPatientRequest reg = new AuthDTOs.RegisterPatientRequest();
        reg.setName("Forbidden Test");
        reg.setEmail("forbidden@example.com");
        reg.setPassword("password123");
        reg.setDateOfBirth("1990-01-01");
        reg.setGender("MALE");
        reg.setPhone("9999999999");

        restTemplate.exchange(baseUrl() + "/auth/register", HttpMethod.POST,
                new HttpEntity<>(reg, headers()), ApiResponse.class);

        // Try to access admin endpoint — need a token first
        AuthDTOs.LoginRequest login = new AuthDTOs.LoginRequest();
        login.setEmail("forbidden@example.com");
        login.setPassword("password123");

        ResponseEntity<ApiResponse> loginResponse = restTemplate.exchange(
                baseUrl() + "/auth/login", HttpMethod.POST, new HttpEntity<>(login, headers()), ApiResponse.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) loginResponse.getBody().getData();
        String token = (String) data.get("accessToken");

        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                baseUrl() + "/admin/doctors", HttpMethod.GET, new HttpEntity<>(headers(token)), ApiResponse.class);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }
}