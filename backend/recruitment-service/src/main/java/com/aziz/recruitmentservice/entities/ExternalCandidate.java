package com.aziz.recruitmentservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Candidat externe importé dans le pool de recrutement (typiquement depuis LinkedIn).
 * Évalué par le même moteur de matching IA que les candidats internes.
 */
@Entity
@Table(name = "external_candidates")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExternalCandidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String email;

    private String phone;

    /** URL du profil LinkedIn ou autre source */
    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    /** Source du candidat (LINKEDIN, MANUAL, OTHER) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExternalCandidateSource source;

    /** Années d'expérience (issues du CV ou saisies par le RH) */
    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    /** Poste recherché / titre du candidat */
    @Column(name = "current_position")
    private String currentPosition;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (source == null) source = ExternalCandidateSource.MANUAL;
    }

    /** Compétences du candidat avec niveau (1-5), alignées sur le catalogue Skill */
    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<ExternalCandidateSkill> skills = new ArrayList<>();
}
