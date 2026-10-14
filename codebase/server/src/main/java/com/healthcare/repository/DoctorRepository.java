package com.healthcare.repository;

import com.healthcare.entity.Doctor;
import com.healthcare.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Doctor entity operations.
 */
@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    /**
     * Find doctor by user.
     *
     * @param user user entity
     * @return Optional containing doctor if found
     */
    Optional<Doctor> findByUser(User user);

    /**
     * Find doctors by specialization.
     *
     * @param specialization doctor specialization
     * @return List of doctors
     */
    List<Doctor> findBySpecialization(String specialization);

    /**
     * Find available doctors.
     *
     * @return List of available doctors
     */
    List<Doctor> findByIsAvailableTrue();

    /**
     * Find doctors by status with pagination.
     *
     * @param status doctor status
     * @param pageable pagination info
     * @return Page of doctors
     */
    Page<Doctor> findByStatus(Doctor.Status status, Pageable pageable);
}