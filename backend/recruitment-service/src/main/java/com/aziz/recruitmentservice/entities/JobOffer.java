package com.aziz.recruitmentservice.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

    /** Competences requises (relation ManyToMany avec Skill) */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "job_offer_skills",
        joinColumns = @JoinColumn(name = "job_offer_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    @Builder.Default
    private Set<Skill> skills = new HashSet<>();

    /** Niveau requis (1-5) par compétence, indexé par skillId. Utilisé pour le matching IA. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "job_offer_skill_levels",
        joinColumns = @JoinColumn(name = "job_offer_id")
    )
    @MapKeyColumn(name = "skill_id")
    @Column(name = "required_level")
    @Builder.Default
    private Map<Long, Integer> skillLevels = new HashMap<>();

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
