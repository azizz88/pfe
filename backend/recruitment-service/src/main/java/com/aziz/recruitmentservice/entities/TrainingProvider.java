package com.aziz.recruitmentservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Catalogue des organismes de formation externes que l'entreprise peut solliciter
 * pour faire monter en compétence un candidat classé TRAINING ou un employé en
 * succession planning. Utilisé comme source par la suggestion IA (Claude API).
 */
@Entity
@Table(name = "training_providers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TrainingProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String website;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "training_provider_skills",
        joinColumns = @JoinColumn(name = "provider_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    @JsonIgnoreProperties({"jobOffers"})
    @Builder.Default
    private Set<Skill> skillsCovered = new HashSet<>();

    @Column(name = "qualiopi_certified", nullable = false)
    @Builder.Default
    private boolean qualiopiCertified = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "convention_status", nullable = false, length = 20)
    private ConventionStatus conventionStatus;

    @Column(name = "avg_price_eur")
    private Integer avgPriceEur;

    @Column(name = "avg_duration_days")
    private Integer avgDurationDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_mode", length = 20)
    private DeliveryMode deliveryMode;

    @Column(name = "past_success_rate")
    private Double pastSuccessRate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
