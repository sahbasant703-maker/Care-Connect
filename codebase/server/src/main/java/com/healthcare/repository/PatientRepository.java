package com.healthcare.repository;

import com.healthcare.entity.Patient;
import com.healthcare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Patient entity operations.
 */
@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    /**
     * Find patient by user.
     *
     * @param user user entity
     * @return Optional containing patient if found
     */
    Optional<Patient> findByUser(User user);
}