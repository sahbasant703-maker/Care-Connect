package com.healthcare.repository;

import com.healthcare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for User entity operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email.
     *
     * @param email user email
     * @return Optional containing user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if user exists by email.
     *
     * @param email user email
     * @return true if user exists
     */
    boolean existsByEmail(String email);
}