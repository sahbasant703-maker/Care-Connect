package com.healthcare.config;

import com.healthcare.entity.User;
import com.healthcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Initialize test data on application startup.
 * Creates or updates an admin user.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        userRepository.findByEmail("admin@example.com").ifPresentOrElse(
                user -> {
                    user.setRole(User.Role.ADMIN);
                    user.setPassword(passwordEncoder.encode("admin123"));
                    userRepository.save(user);
                    System.out.println("Updated admin user: admin@example.com / admin123");
                },
                () -> {
                    User admin = User.builder()
                            .name("Admin User")
                            .email("admin@example.com")
                            .password(passwordEncoder.encode("admin123"))
                            .role(User.Role.ADMIN)
                            .build();
                    userRepository.save(admin);
                    System.out.println("Created admin user: admin@example.com / admin123");
                }
        );
    }
}