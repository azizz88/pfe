package com.aziz.recruitmentservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entité représentant un entretien planifié pour une candidature.
 * Un entretien est assigné à un manager (rôle Keycloak MANAGER) qui le conduit.
 */
@Entity
@Table(name = "interviews")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Candidature associée (candidat interne).
     * Null si l'entretien concerne un candidat externe — dans ce cas externalCandidateId est renseigné.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "application_id")
    @JsonIgnore
    private Application application;

    /** ID de la candidature (pour la sérialisation). Null pour les externes. */
    @Column(name = "application_id", insertable = false, updatable = false)
    private Long applicationId;

    /** ID du candidat externe — non null si applicationId est null. */
    @Column(name = "external_candidate_id")
    private Long externalCandidateId;

    /** Titre de l'offre (dénormalisé pour les entretiens externes qui n'ont pas d'Application). */
    @Column(name = "job_offer_title")
    private String jobOfferTitle;

    /** ID de l'offre (pour permettre au manager de voir le contexte côté externe). */
    @Column(name = "job_offer_id")
    private Long jobOfferId;

    /** Nom du candidat (dénormalisé pour les externes). */
    @Column(name = "candidate_name")
    private String candidateName;

    /**
     * Date et heure prévues de l'entretien.
     * Null tant que l'entretien est en PENDING_SCHEDULING (le manager n'a pas encore planifié).
     */
    @Column(nullable = true)
    private LocalDateTime scheduledDate;

    /**
     * Nom de l'intervieweur (display libre).
     * Null en PENDING_SCHEDULING, renseigné par le manager à la planification (par défaut son propre nom).
     */
    @Column(nullable = true)
    private String interviewer;

    /** Username Keycloak du manager assigné à cet entretien. */
    @Column(name = "manager_username")
    private String managerUsername;

    /** Nom complet du manager assigné (dénormalisé pour faciliter l'affichage). */
    @Column(name = "manager_name")
    private String managerName;

    /** Email du manager assigné (dénormalisé pour les notifications phase 1 + relance). */
    @Column(name = "manager_email")
    private String managerEmail;

    /** Statut du cycle de vie (SCHEDULED / COMPLETED / CANCELLED). */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private InterviewStatus status;

    /** Type de candidat évalué (INTERNAL / EXTERNAL). */
    @Enumerated(EnumType.STRING)
    @Column(name = "candidate_type", length = 20)
    private CandidateType candidateType;

    /** Lieu ou lien visio de l'entretien (optionnel). */
    private String location;

    /**
     * Email du candidat à convoquer.
     * Renseigné automatiquement pour les candidats internes (lookup via matricule),
     * obligatoire pour les candidats externes (saisi par le RH).
     */
    @Column(name = "candidate_email")
    private String candidateEmail;

    /** Notes / compte-rendu de l'entretien */
    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Résultat de l'entretien (POSITIF, NÉGATIF, EN_COURS) */
    private String result;

    /** Horodatage de l'affectation au manager par le RH (phase 1). */
    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    /** Horodatage de la planification effective par le manager (phase 2). */
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    /**
     * Note du RH au manager au moment de l'affectation (contexte, contraintes, etc.).
     * Visible uniquement par le manager dans son dashboard.
     */
    @Column(name = "rh_note", columnDefinition = "TEXT")
    private String rhNote;

    /**
     * Motif du refus si le manager a rejeté l'affectation (status REJECTED_BY_MANAGER).
     * Permet au RH de comprendre et de réaffecter à un autre manager.
     */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    /**
     * Catégorie de matching dénormalisée depuis l'Application (IDEAL / TRAINING / EXTERNAL).
     * Permet au manager de voir directement si le candidat est "À former" sans appeler
     * une API supplémentaire. Recopiée par le RH lors de l'affectation.
     */
    @Column(name = "matching_category", length = 20)
    private String matchingCategory;

    /** Score de matching dénormalisé (0-100). */
    @Column(name = "matching_score")
    private Double matchingScore;

    /**
     * Plan de formation rédigé par le manager pour un candidat "À Former".
     * Saisi via le bouton "Recommander une formation" dans l'espace manager.
     */
    @Column(name = "training_plan", columnDefinition = "TEXT")
    private String trainingPlan;

    /** Durée estimée de la formation (texte libre : "2 semaines", "3 mois", ...). */
    @Column(name = "training_duration", length = 100)
    private String trainingDuration;

    /** Notes complémentaires du manager sur la formation (modalités, mentor, objectifs...). */
    @Column(name = "training_notes", columnDefinition = "TEXT")
    private String trainingNotes;

    /** Horodatage de la recommandation de formation par le manager. */
    @Column(name = "training_recommended_at")
    private LocalDateTime trainingRecommendedAt;
}
