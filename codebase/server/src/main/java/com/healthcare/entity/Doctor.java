package com.healthcare.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Doctor entity representing doctor profiles.
 * Maps to tblDoctors table.
 */
@Entity
@Table(name = "tblDoctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 100)
    private String specialization;

    @Column(nullable = false)
    private Integer experience;

    @Column(length = 500)
    private String bio;

    @Column(name = "consultation_fee")
    private Double consultationFee;

    @Builder.Default
    @Column(name = "is_available")
    private Boolean isAvailable = true;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "certification_path", length = 500)
    private String certificationPath;

    @Column(length = 10)
    private String gender;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Doctor approval status.
     */
    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}