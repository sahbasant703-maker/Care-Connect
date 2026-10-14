package com.healthcare.service;

import com.healthcare.dto.AppointmentDTOs;
import com.healthcare.dto.DoctorDTOs;
import com.healthcare.entity.Appointment;
import com.healthcare.entity.Doctor;
import com.healthcare.entity.Patient;
import com.healthcare.entity.User;
import com.healthcare.repository.AppointmentRepository;
import com.healthcare.repository.DoctorRepository;
import com.healthcare.repository.PatientRepository;
import com.healthcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Service for doctor management (admin operations + doctor-facing operations).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get all doctors with pagination.
     *
     * @param pageable pagination info
     * @return page of doctor responses
     */
    @Transactional(readOnly = true)
    public Page<DoctorDTOs.DoctorResponse> getAllDoctors(Pageable pageable) {
        log.debug("Fetching all doctors with pagination");
        return doctorRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get doctor by ID.
     *
     * @param id doctor ID
     * @return doctor response
     */
    @Transactional(readOnly = true)
    public DoctorDTOs.DoctorResponse getDoctorById(Long id) {
        log.debug("Fetching doctor by ID: {}", id);
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with ID: " + id));
        return mapToResponse(doctor);
    }

    /**
     * Update doctor approval status.
     *
     * @param id doctor ID
     * @param status new status (APPROVED/REJECTED)
     * @return updated doctor response
     */
    @Transactional
    public DoctorDTOs.DoctorResponse updateDoctorStatus(Long id, Doctor.Status status) {
        log.debug("Updating doctor status to {} for ID: {}", status, id);
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with ID: " + id));

        if (status == Doctor.Status.REJECTED) {
            // Also delete the user account if rejected
            User user = doctor.getUser();
            doctorRepository.delete(doctor);
            userRepository.delete(user);
            log.info("Doctor rejected and removed: {}", user.getEmail());
            return null;
        }

        doctor.setStatus(status);
        doctor = doctorRepository.save(doctor);
        log.info("Doctor status updated to {}: {}", status, doctor.getUser().getEmail());
        return mapToResponse(doctor);
    }

    /**
     * Get pending doctors for admin review.
     *
     * @param pageable pagination info
     * @return page of pending doctor responses
     */
    @Transactional(readOnly = true)
    public Page<DoctorDTOs.DoctorResponse> getPendingDoctors(Pageable pageable) {
        log.debug("Fetching pending doctors");
        return doctorRepository.findByStatus(Doctor.Status.PENDING, pageable)
                .map(this::mapToResponse);
    }

    // ===== Doctor-facing methods =====

    /**
     * Get the Doctor entity for the currently authenticated doctor user.
     *
     * @param email authenticated doctor's email
     * @return doctor entity
     */
    @Transactional(readOnly = true)
    public Doctor getCurrentDoctor(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return doctorRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Doctor profile not found"));
    }

    /**
     * Get doctor's own profile.
     *
     * @param email authenticated doctor's email
     * @return doctor response
     */
    @Transactional(readOnly = true)
    public DoctorDTOs.DoctorResponse getMyProfile(String email) {
        log.debug("Fetching profile for doctor: {}", email);
        return mapToResponse(getCurrentDoctor(email));
    }

    /**
     * Get doctor's appointments with pagination.
     *
     * @param email authenticated doctor's email
     * @param pageable pagination info
     * @return page of appointment responses
     */
    @Transactional(readOnly = true)
    public Page<AppointmentDTOs.AppointmentResponse> getMyAppointments(String email, Pageable pageable) {
        log.debug("Fetching appointments for doctor: {}", email);
        Doctor doctor = getCurrentDoctor(email);
        return appointmentRepository.findByDoctor(doctor, pageable)
                .map(this::mapAppointmentToResponse);
    }

    /**
     * Get doctor's upcoming appointments (today onward, scheduled/confirmed only).
     *
     * @param email authenticated doctor's email
     * @return list of upcoming appointment responses
     */
    @Transactional(readOnly = true)
    public java.util.List<AppointmentDTOs.AppointmentResponse> getUpcomingAppointments(String email) {
        log.debug("Fetching upcoming appointments for doctor: {}", email);
        Doctor doctor = getCurrentDoctor(email);
        return appointmentRepository.findUpcomingByDoctor(doctor, LocalDate.now())
                .stream()
                .map(this::mapAppointmentToResponse)
                .toList();
    }

    /**
     * Update appointment status and doctor notes.
     *
     * @param email authenticated doctor's email
     * @param appointmentId appointment ID
     * @param status new status (CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
     * @param doctorNotes optional doctor notes
     * @return updated appointment response
     */
    @Transactional
    public AppointmentDTOs.AppointmentResponse updateAppointmentStatus(
            String email, Long appointmentId, String status, String doctorNotes) {
        log.debug("Updating appointment {} status to {} by doctor: {}", appointmentId, status, email);

        Doctor doctor = getCurrentDoctor(email);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        // Only allow this doctor to update their own appointments
        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new IllegalArgumentException("This appointment does not belong to you");
        }

        Appointment.Status newStatus;
        try {
            newStatus = Appointment.Status.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        // Doctors cannot mark appointments as SCHEDULED — only patients create those
        if (newStatus == Appointment.Status.SCHEDULED) {
            throw new IllegalArgumentException("Cannot set status to SCHEDULED");
        }

        appointment.setStatus(newStatus);
        if (doctorNotes != null) {
            appointment.setDoctorNotes(doctorNotes);
        }
        if (newStatus == Appointment.Status.CANCELLED) {
            appointment.setCancelledBy("DOCTOR");
        }

        appointment = appointmentRepository.save(appointment);
        log.info("Appointment {} updated to {} by doctor {}", appointmentId, newStatus, doctor.getUser().getEmail());
        return mapAppointmentToResponse(appointment);
    }

    /**
     * Toggle doctor's availability status.
     *
     * @param email authenticated doctor's email
     * @return updated doctor response
     */
    @Transactional
    public DoctorDTOs.DoctorResponse toggleAvailability(String email) {
        log.debug("Toggling availability for doctor: {}", email);
        Doctor doctor = getCurrentDoctor(email);
        doctor.setIsAvailable(!doctor.getIsAvailable());
        doctor = doctorRepository.save(doctor);
        log.info("Doctor {} availability set to {}", doctor.getUser().getEmail(), doctor.getIsAvailable());
        return mapToResponse(doctor);
    }

    /**
     * Create a doctor account (admin — auto-approved).
     *
     * @param request doctor creation request
     * @return created doctor response
     */
    @Transactional
    public DoctorDTOs.DoctorResponse createDoctor(DoctorDTOs.CreateDoctorRequest request) {
        log.debug("Admin creating doctor: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("A user with this email already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.DOCTOR)
                .build();
        user = userRepository.save(user);

        Doctor doctor = Doctor.builder()
                .user(user)
                .specialization(request.getSpecialization())
                .experience(request.getExperience())
                .bio(request.getBio())
                .consultationFee(request.getConsultationFee())
                .isAvailable(true)
                .status(Doctor.Status.APPROVED)
                .gender(request.getGender() != null ? request.getGender().toUpperCase() : "MALE")
                .build();
        doctor = doctorRepository.save(doctor);
        log.info("Admin created doctor: {} ({})", doctor.getUser().getEmail(), doctor.getSpecialization());
        return mapToResponse(doctor);
    }

    /**
     * Get a patient's details (doctor can only see patients who have appointments with them).
     *
     * @param email authenticated doctor's email
     * @param patientId patient ID
     * @return patient response
     */
    @Transactional(readOnly = true)
    public com.healthcare.dto.PatientDTOs.PatientProfileResponse getPatientDetails(String email, Long patientId) {
        Doctor doctor = getCurrentDoctor(email);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        // Verify this patient has at least one appointment with this doctor
        if (appointmentRepository.findByDoctorAndPatient(doctor, patient).isEmpty()) {
            throw new IllegalArgumentException("This patient has no appointments with you");
        }

        User patientUser = patient.getUser();
        return com.healthcare.dto.PatientDTOs.PatientProfileResponse.builder()
                .id(patient.getId())
                .name(patientUser.getName())
                .email(patientUser.getEmail())
                .phone(patient.getPhone())
                .dateOfBirth(patient.getDateOfBirth() != null ? patient.getDateOfBirth().toString() : null)
                .address(patient.getAddress())
                .gender(patient.getGender() != null ? patient.getGender().name() : null)
                .bloodGroup(patient.getBloodGroup())
                .createdAt(patient.getCreatedAt().toString())
                .build();
    }

    /**
     * Map Doctor entity to DoctorResponse DTO.
     */
    private DoctorDTOs.DoctorResponse mapToResponse(Doctor doctor) {
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
                .status(doctor.getStatus().name())
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
}