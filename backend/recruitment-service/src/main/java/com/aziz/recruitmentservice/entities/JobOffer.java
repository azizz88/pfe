package com.aziz.recruitmentservice.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant une offre d'emploi interne.
 */
@Entity
@Table(name = "job_offers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class JobOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Titre du poste */
    @Column(nullable = false)
    private String title;

    /** Description détaillée du poste */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Département concerné */
    @Column(nullable = false)
    private String department;

    /** Compétences requises */
    @Column(columnDefinition = "TEXT")
    private String requiredSkills;

    /** Statut de l'offre : ACTIVE ou CLOSED */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobOfferStatus status;

    /** Date de publication */
    private LocalDate publishDate;

    /** Date limite pour postuler */
    private LocalDate deadline;

    /** Liste des candidatures reçues */
    @OneToMany(mappedBy = "jobOffer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Application> applications = new ArrayList<>();
}
