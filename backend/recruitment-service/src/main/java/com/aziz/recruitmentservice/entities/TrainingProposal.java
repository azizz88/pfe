package com.aziz.recruitmentservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Proposition de formation faite par un manager à un employé/candidat.
 * Découplée de la candidature : sourceApplicationId est nullable, permettant
 * une proposition proactive de succession planning sans candidature ouverte.
 */
@Entity
@Table(name = "training_proposals")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TrainingProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Matricule de l'employé bénéficiaire. */
    @Column(name = "employee_matricule", nullable = false, length = 50)
    private String employeeMatricule;

    /** Nom complet de l'employé (dénormalisé pour l'affichage). */
    @Column(name = "employee_name")
    private String employeeName;

    /** Email de l'employé (dénormalisé pour notifications). */
    @Column(name = "employee_email")
    private String employeeEmail;

    /** Username Keycloak du manager qui a proposé la formation. */
    @Column(name = "manager_username", nullable = false, length = 100)
    private String managerUsername;

    /** Nom du manager (dénormalisé). */
    @Column(name = "manager_name")
    private String managerName;

    /** Organisme de formation choisi par le manager. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "provider_id", nullable = false)
    @JsonIgnoreProperties({"skillsCovered"})
    private TrainingProvider provider;

    /** ID de la candidature source (nullable — découplage formation ↔ candidature). */
    @Column(name = "source_application_id")
    private Long sourceApplicationId;

    /** IDs des Skills à acquérir (entrée du matching IA). */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "training_proposal_missing_skills",
        joinColumns = @JoinColumn(name = "proposal_id")
    )
    @Column(name = "skill_id")
    @Builder.Default
    private List<Long> missingSkillIds = new ArrayList<>();

    /** Score IA généré au moment de la proposition (0-100). */
    @Column(name = "ai_score")
    private Integer aiScore;

    /** Justification IA (texte court). */
    @Column(name = "ai_justification", columnDefinition = "TEXT")
    private String aiJustification;

    /** Source du score : "AI" (Gemini) ou "FALLBACK" (set-overlap). */
    @Column(name = "ai_source", length = 20)
    private String aiSource;

    /** Statut du workflow. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TrainingProposalStatus status;

    /** URL/référence du certificat uploadé en fin de formation (optionnel). */
    @Column(name = "certificate_url", length = 500)
    private String certificateUrl;

    /** Notes libres du manager (non visibles par l'employé). */
    @Column(name = "manager_notes", columnDefinition = "TEXT")
    private String managerNotes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** Horodatage de la décision de l'employé (accept/refuse). */
    @Column(name = "decision_date")
    private LocalDateTime decisionDate;

    /** Horodatage de l'inscription effective auprès de l'organisme. */
    @Column(name = "enrollment_date")
    private LocalDateTime enrollmentDate;

    /** Horodatage de la fin de formation. */
    @Column(name = "completion_date")
    private LocalDateTime completionDate;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
        if (status == null) status = TrainingProposalStatus.PROPOSED;
    }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
