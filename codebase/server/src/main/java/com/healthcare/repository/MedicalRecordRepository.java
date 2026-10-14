package com.healthcare.repository;

import com.healthcare.entity.MedicalRecord;
import com.healthcare.entity.Appointment;
import com.healthcare.entity.Doctor;
import com.healthcare.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for MedicalRecord entity operations.
 */
@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    /**
     * Find medical records by doctor with pagination.
     *
     * @param doctor doctor entity
     * @param pageable pagination info
     * @return Page of medical records
     */
    Page<MedicalRecord> findByDoctor(Doctor doctor, Pageable pageable);

    /**
     * Find medical records by patient with pagination.
     *
     * @param patient patient entity
     * @param pageable pagination info
     * @return Page of medical records
     */
    Page<MedicalRecord> findByPatient(Patient patient, Pageable pageable);

    /**
     * Find medical records by appointment.
     *
     * @param appointment appointment entity
     * @return List of medical records
     */
    List<MedicalRecord> findByAppointment(Appointment appointment);
}