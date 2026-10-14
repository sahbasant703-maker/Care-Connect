package com.healthcare.service;

import com.healthcare.dto.AppointmentDTOs;
import com.healthcare.dto.DoctorDTOs;
import com.healthcare.dto.MedicalRecordDTOs;
import com.healthcare.dto.PatientDTOs;
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
import java.time.LocalTime;

/**
 * Service for patient-facing operations: profile, doctor browsing, appointment booking.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PatientService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    /**
     * Get the Patient entity for the currently authenticated user.
     *
     * @param email authenticated user's email
     * @return patient entity
     */
    @Transactional(readOnly = true)
    public Patient getCurrentPatient(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return patientRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));
    }

    /**
     * Get available doctors (approved and available) with pagination.
     *
     * @param pageable pagination info
     * @return page of doctor responses
     */
    @Transactional(readOnly = true)
    public Page<DoctorDTOs.DoctorResponse> getAvailableDoctors(Pageable pageable) {
        log.debug("Fetching available doctors");
        return doctorRepository.findByStatus(Doctor.Status.APPROVED, pageable)
                .map(this::mapDoctorToResponse);
    }

    /**
     * Book an appointment with a doctor.
     *
     * @param email authenticated patient's email
     * @param request booking request with doctorId, date, time, reason
     * @return created appointment response
     */
    @Transactional
    public AppointmentDTOs.AppointmentResponse bookAppointment(String email, AppointmentDTOs.BookAppointmentRequest request) {
        log.debug("Booking appointment for patient: {}", email);

        Patient patient = getCurrentPatient(email);
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));

        // Only allow booking approved doctors
        if (doctor.getStatus() != Doctor.Status.APPROVED) {
            throw new IllegalArgumentException("This doctor is not available for bookings");
        }

        LocalDate date = LocalDate.parse(request.getAppointmentDate());
        LocalTime time = LocalTime.parse(request.getAppointmentTime());

        // Check for booking conflict (same doctor, same date+time, not cancelled)
        boolean conflict = appointmentRepository
                .findByDoctorAndPatientAndAppointmentDateAndAppointmentTime(doctor, patient, date, time)
                .isPresent();
        if (conflict) {
            throw new IllegalArgumentException("You already have an appointment at this time");
        }

        Appointment appointment = Appointment.builder()
                .doctor(doctor)
                .patient(patient)
                .appointmentDate(date)
                .appointmentTime(time)
                .reasonForVisit(request.getReasonForVisit())
                .status(Appointment.Status.SCHEDULED)
                .build();

        appointment = appointmentRepository.save(appointment);
        log.info("Appointment booked: patient={} doctor={} date={} time={}",
                patient.getId(), doctor.getId(), date, time);

        return mapAppointmentToResponse(appointment);
    }

    /**
     * Get the current patient's full profile.
     *
     * @param email authenticated patient's email
     * @return patient profile response
     */
    @Transactional(readOnly = true)
    public PatientDTOs.PatientProfileResponse getMyProfile(String email) {
        log.debug("Fetching profile for patient: {}", email);
        Patient patient = getCurrentPatient(email);
        User user = patient.getUser();
        return PatientDTOs.PatientProfileResponse.builder()
                .id(patient.getId())
                .name(user.getName())
                .email(user.getEmail())
                .dateOfBirth(patient.getDateOfBirth() != null ? patient.getDateOfBirth().toString() : null)
                .gender(patient.getGender() != null ? patient.getGender().name() : null)
                .phone(patient.getPhone())
                .address(patient.getAddress())
                .emergencyContactName(patient.getEmergencyContactName())
                .emergencyContactPhone(patient.getEmergencyContactPhone())
                .bloodGroup(patient.getBloodGroup())
                .allergies(patient.getAllergies())
                .createdAt(patient.getCreatedAt().toString())
                .build();
    }

    /**
     * Get patient's appointment history with pagination.
     *
     * @param email authenticated patient's email
     * @param pageable pagination info
     * @return page of appointment responses
     */
    @Transactional(readOnly = true)
    public Page<AppointmentDTOs.AppointmentResponse> getMyAppointments(String email, Pageable pageable) {
        log.debug("Fetching appointments for patient: {}", email);
        Patient patient = getCurrentPatient(email);
        return appointmentRepository.findByPatient(patient, pageable)
                .map(this::mapAppointmentToResponse);
    }

    /**
     * Get all patients (admin only).
     *
     * @param pageable pagination info
     * @return page of patient list items
     */
    @Transactional(readOnly = true)
    public Page<com.healthcare.dto.PatientDTOs.PatientListItemResponse> getAllPatients(Pageable pageable) {
        log.debug("Fetching all patients");
        return patientRepository.findAll(pageable)
                .map(this::mapPatientToListItem);
    }

    /**
     * Get all appointments (admin only).
     *
     * @param pageable pagination info
     * @return page of appointment responses
     */
    @Transactional(readOnly = true)
    public Page<AppointmentDTOs.AppointmentResponse> getAllAppointments(Pageable pageable) {
        log.debug("Fetching all appointments");
        return appointmentRepository.findAll(pageable)
                .map(this::mapAppointmentToResponse);
    }

    /**
     * Map Patient entity to PatientListItemResponse DTO.
     */
    private com.healthcare.dto.PatientDTOs.PatientListItemResponse mapPatientToListItem(Patient patient) {
        User user = patient.getUser();
        return com.healthcare.dto.PatientDTOs.PatientListItemResponse.builder()
                .id(patient.getId())
                .name(user.getName())
                .email(user.getEmail())
                .dateOfBirth(patient.getDateOfBirth() != null ? patient.getDateOfBirth().toString() : null)
                .gender(patient.getGender() != null ? patient.getGender().name() : null)
                .phone(patient.getPhone())
                .createdAt(patient.getCreatedAt().toString())
                .build();
    }

    /**
     * Cancel an appointment (patient can only cancel their own).
     *
     * @param email authenticated patient's email
     * @param appointmentId appointment ID
     * @param request cancellation reason
     * @return updated appointment response
     */
    @Transactional
    public AppointmentDTOs.AppointmentResponse cancelAppointment(
            String email, Long appointmentId, AppointmentDTOs.CancelAppointmentRequest request) {
        log.debug("Cancelling appointment {} for patient: {}", appointmentId, email);

        Patient patient = getCurrentPatient(email);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new IllegalArgumentException("This appointment does not belong to you");
        }

        if (appointment.getStatus() == Appointment.Status.CANCELLED) {
            throw new IllegalArgumentException("Appointment is already cancelled");
        }
        if (appointment.getStatus() == Appointment.Status.COMPLETED) {
            throw new IllegalArgumentException("Cannot cancel a completed appointment");
        }

        appointment.setStatus(Appointment.Status.CANCELLED);
        appointment.setCancelledBy("PATIENT");
        appointment.setCancellationReason(request.getCancellationReason());

        appointment = appointmentRepository.save(appointment);
        log.info("Appointment {} cancelled by patient {}", appointmentId, patient.getId());
        return mapAppointmentToResponse(appointment);
    }

    /**
     * Reschedule an appointment to a new date and time.
     *
     * @param email authenticated patient's email
     * @param appointmentId appointment ID
     * @param request new date and time
     * @return updated appointment response
     */
    @Transactional
    public AppointmentDTOs.AppointmentResponse rescheduleAppointment(
            String email, Long appointmentId, AppointmentDTOs.BookAppointmentRequest request) {
        log.debug("Rescheduling appointment {} for patient: {}", appointmentId, email);

        Patient patient = getCurrentPatient(email);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new IllegalArgumentException("This appointment does not belong to you");
        }

        // Can only reschedule SCHEDULED or CONFIRMED appointments
        if (!"SCHEDULED".equals(appointment.getStatus().name()) && !"CONFIRMED".equals(appointment.getStatus().name())) {
            throw new IllegalArgumentException("Cannot reschedule a " + appointment.getStatus().name().toLowerCase() + " appointment");
        }

        LocalDate newDate = LocalDate.parse(request.getAppointmentDate());
        LocalTime newTime = LocalTime.parse(request.getAppointmentTime());

        // Check for conflict with the new slot
        boolean conflict = appointmentRepository
                .findByDoctorAndPatientAndAppointmentDateAndAppointmentTime(
                        appointment.getDoctor(), patient, newDate, newTime)
                .isPresent();
        if (conflict) {
            throw new IllegalArgumentException("You already have an appointment at this new time");
        }

        appointment.setAppointmentDate(newDate);
        appointment.setAppointmentTime(newTime);
        appointment.setStatus(Appointment.Status.SCHEDULED);
        if (request.getReasonForVisit() != null) {
            appointment.setReasonForVisit(request.getReasonForVisit());
        }

        appointment = appointmentRepository.save(appointment);
        log.info("Appointment {} rescheduled to {} {}", appointmentId, newDate, newTime);
        return mapAppointmentToResponse(appointment);
    }

    /**
     * Get patient's medical records with pagination.
     *
     * @param email authenticated patient's email
     * @param pageable pagination info
     * @return page of medical records
     */
    @Transactional(readOnly = true)
    public Page<MedicalRecordDTOs.MedicalRecordResponse> getMyMedicalRecords(String email, Pageable pageable) {
        log.debug("Fetching medical records for patient: {}", email);
        Patient patient = getCurrentPatient(email);
        return medicalRecordRepository.findByPatient(patient, pageable)
                .map(this::mapRecordToResponse);
    }

    /**
     * Map Doctor entity to DoctorResponse DTO.
     */
    private DoctorDTOs.DoctorResponse mapDoctorToResponse(Doctor doctor) {
        User user = doctor.getUser();
        return DoctorDTOs.DoctorResponse.builder()
                .id(doctor.getId())
                .name(user.getName())
                .email(user.getEmail())
                .specialization(doctor.getSpecialization())
                .experience(doctor.getExperience())
                .bio(doctor.getBio())
                .consultationFee(doctor.getConsultationFee())
                .isAvailable(doctor.getIsAvailable())
                .certificationPath(doctor.getCertificationPath())
                .gender(doctor.getGender())
                .createdAt(doctor.getCreatedAt().toString())
                .build();
    }

    /**
     * Map Appointment entity to AppointmentResponse DTO.
     */
    private AppointmentDTOs.AppointmentResponse mapAppointmentToResponse(Appointment appointment) {
        return AppointmentDTOs.AppointmentResponse.builder()
                .id(appointment.getId())
                .doctorId(appointment.getDoctor().getId())
                .doctorName(appointment.getDoctor().getUser().getName())
                .doctorSpecialization(appointment.getDoctor().getSpecialization())
                .doctorGender(appointment.getDoctor().getGender())
                .patientId(appointment.getPatient().getId())
                .patientName(appointment.getPatient().getUser().getName())
                .patientGender(appointment.getPatient().getGender() != null ? appointment.getPatient().getGender().name() : null)
                .appointmentDate(appointment.getAppointmentDate().toString())
                .appointmentTime(appointment.getAppointmentTime().toString())
                .status(appointment.getStatus().name())
                .reasonForVisit(appointment.getReasonForVisit())
                .doctorNotes(appointment.getDoctorNotes())
                .createdAt(appointment.getCreatedAt().toString())
                .build();
    }

    /**
     * Map MedicalRecord entity to response DTO.
     */
    private MedicalRecordDTOs.MedicalRecordResponse mapRecordToResponse(MedicalRecord record) {
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