package com.healthcare.repository;

import com.healthcare.entity.Appointment;
import com.healthcare.entity.Doctor;
import com.healthcare.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Appointment entity operations.
 */
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /**
     * Find appointments by doctor with pagination.
     *
     * @param doctor doctor entity
     * @param pageable pagination info
     * @return Page of appointments
     */
    Page<Appointment> findByDoctor(Doctor doctor, Pageable pageable);

    /**
     * Find appointments by patient with pagination.
     *
     * @param patient patient entity
     * @param pageable pagination info
     * @return Page of appointments
     */
    Page<Appointment> findByPatient(Patient patient, Pageable pageable);

    /**
     * Find appointments by doctor and date.
     *
     * @param doctor doctor entity
     * @param date appointment date
     * @return List of appointments
     */
    List<Appointment> findByDoctorAndAppointmentDate(Doctor doctor, LocalDate date);

    /**
     * Find appointments by patient and date.
     *
     * @param patient patient entity
     * @param date appointment date
     * @return List of appointments
     */
    List<Appointment> findByPatientAndAppointmentDate(Patient patient, LocalDate date);

    /**
     * Find appointment by doctor, patient, date and time.
     *
     * @param doctor doctor entity
     * @param patient patient entity
     * @param date appointment date
     * @param time appointment time
     * @return Optional containing appointment if found
     */
    Optional<Appointment> findByDoctorAndPatientAndAppointmentDateAndAppointmentTime(
            Doctor doctor, Patient patient, LocalDate date, java.time.LocalTime time);

    /**
     * Find all appointments between a doctor and a patient.
     *
     * @param doctor doctor entity
     * @param patient patient entity
     * @return List of appointments
     */
    List<Appointment> findByDoctorAndPatient(Doctor doctor, Patient patient);

    /**
     * Find upcoming appointments for a doctor.
     *
     * @param doctor doctor entity
     * @param date current date
     * @return List of upcoming appointments
     */
    @Query("SELECT a FROM Appointment a WHERE a.doctor = :doctor AND a.appointmentDate >= :date AND a.status IN ('SCHEDULED', 'CONFIRMED') ORDER BY a.appointmentDate, a.appointmentTime")
    List<Appointment> findUpcomingByDoctor(Doctor doctor, LocalDate date);

    /**
     * Find upcoming appointments for a patient.
     *
     * @param patient patient entity
     * @param date current date
     * @return List of upcoming appointments
     */
    @Query("SELECT a FROM Appointment a WHERE a.patient = :patient AND a.appointmentDate >= :date AND a.status IN ('SCHEDULED', 'CONFIRMED') ORDER BY a.appointmentDate, a.appointmentTime")
    List<Appointment> findUpcomingByPatient(Patient patient, LocalDate date);
}