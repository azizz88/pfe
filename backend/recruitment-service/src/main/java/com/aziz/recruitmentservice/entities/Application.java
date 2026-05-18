package com.aziz.recruitmentservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant une candidature à une offre d'emploi interne.
 */
@Entity
@Table(name = "applications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Offre d'emploi visée */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "job_offer_id", nullable = false)
    @JsonIgnore
    private JobOffer jobOffer;

    /** ID de l'offre (pour la sérialisation) */
    @Column(name = "job_offer_id", insertable = false, updatable = false)
    private Long jobOfferId;

    /** Titre de l'offre (dénormalisé pour faciliter l'affichage) */
    private String jobOfferTitle;

    /** Matricule de l'employé candidat */
    @Column(nullable = false)
    private String employeeMatricule;

    /** Nom complet du candidat */
    @Column(nullable = false)
    private String applicantName;

    /** Lettre de motivation */
    @Column(columnDefinition = "TEXT")
    private String coverLetter;

    /** Statut de la candidature (workflow) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    /** Date de soumission */
    private LocalDate applicationDate;

    /** Entretiens associés à cette candidature */
    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Interview> interviews = new ArrayList<>();

    /** Catégorie issue du matching IA (IDEAL/TRAINING/EXTERNAL). Null si pas encore matché. */
    @Column(name = "matching_category", length = 20)
    private String matchingCategory;

    /** Score global du matching (0-100). Null si pas encore matché. */
    @Column(name = "matching_score")
    private Double matchingScore;

    /**
     * True si le RH a marqué la candidature comme "à former".
     * Nullable pour permettre la migration sans casser les lignes existantes (NULL == false côté UI).
     */
    @Column(name = "training_recommended")
    private Boolean trainingRecommended = false;

    /** Date à laquelle la formation a été recommandée (audit). */
    @Column(name = "training_recommended_at")
    private java.time.LocalDateTime trainingRecommendedAt;
}
