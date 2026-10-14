package com.healthcare.service;

import com.healthcare.dto.MedicalRecordDTOs;
import com.healthcare.entity.Appointment;
import com.healthcare.entity.Doctor;
import com.healthcare.entity.MedicalRecord;
import com.healthcare.entity.Patient;
import com.healthcare.entity.User;
import com.healthcare.repository.AppointmentRepository;
import com.healthcare.repository.DoctorRepository;
import com.healthcare.repository.MedicalRecordRepository;
import com.healthcare.repository.PatientRepository;
import com.healthcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Service for medical record operations (create, read by doctor/patient).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    /**
     * Create a medical record for an appointment.
     * Only the doctor who owns the appointment can create the record.
     *
     * @param email authenticated doctor's email
     * @param request record details with appointmentId
     * @return created medical record response
     */
    @Transactional
    public MedicalRecordDTOs.MedicalRecordResponse createMedicalRecord(
            String email, MedicalRecordDTOs.CreateMedicalRecordRequest request) {
        log.debug("Creating medical record for appointment {} by doctor: {}", request.getAppointmentId(), email);

        Doctor doctor = getCurrentDoctor(email);
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        // Only allow this doctor to create records for their own appointments
        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new IllegalArgumentException("This appointment does not belong to you");
        }

        // Check if a record already exists for this appointment
        if (!medicalRecordRepository.findByAppointment(appointment).isEmpty()) {
            throw new IllegalArgumentException("A medical record already exists for this appointment");
        }

        Patient patient = appointment.getPatient();

        MedicalRecord record = MedicalRecord.builder()
                .doctor(doctor)
                .patient(patient)
                .appointment(appointment)
                .diagnosis(request.getDiagnosis())
                .prescription(request.getPrescription())
                .notes(request.getNotes())
                .followUpDate(request.getFollowUpDate() != null ? LocalDate.parse(request.getFollowUpDate()) : null)
                .build();

        record = medicalRecordRepository.save(record);
        log.info("Medical record created: id={} appointment={} doctor={} patient={}",
                record.getId(), appointment.getId(), doctor.getId(), patient.getId());

        return mapToResponse(record);
    }

    /**
     * Get medical records created by this doctor.
     *
     * @param email authenticated doctor's email
     * @param pageable pagination info
     * @return page of medical records
     */
    @Transactional(readOnly = true)
    public Page<MedicalRecordDTOs.MedicalRecordResponse> getMyRecords(String email, Pageable pageable) {
        log.debug("Fetching medical records for doctor: {}", email);
        Doctor doctor = getCurrentDoctor(email);
        return medicalRecordRepository.findByDoctor(doctor, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get medical records for a specific patient (patient-facing).
     *
     * @param email authenticated patient's email
     * @param pageable pagination info
     * @return page of medical records
     */
    @Transactional(readOnly = true)
    public Page<MedicalRecordDTOs.MedicalRecordResponse> getPatientRecords(String email, Pageable pageable) {
        log.debug("Fetching medical records for patient: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = patientRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));
        return medicalRecordRepository.findByPatient(patient, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get the Doctor entity for the currently authenticated doctor user.
     */
    private Doctor getCurrentDoctor(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return doctorRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Doctor profile not found"));
    }

    /**
     * Map MedicalRecord entity to response DTO.
     */
    private MedicalRecordDTOs.MedicalRecordResponse mapToResponse(MedicalRecord record) {
        return MedicalRecordDTOs.MedicalRecordResponse.builder()
                .id(record.getId())
                .doctorId(record.getDoctor().getId())
                .doctorName(record.getDoctor().getUser().getName())
                .patientId(record.getPatient().getId())
                .patientName(record.getPatient().getUser().getName())
                .appointmentId(record.getAppointment().getId())
                .diagnosis(record.getDiagnosis())
                .prescription(record.getPrescription())
                .notes(record.getNotes())
                .followUpDate(record.getFollowUpDate() != null ? record.getFollowUpDate().toString() : null)
                .createdAt(record.getCreatedAt().toString())
                .build();
    }
}