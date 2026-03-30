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
}
