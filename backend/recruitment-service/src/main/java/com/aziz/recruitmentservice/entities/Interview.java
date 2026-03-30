package com.aziz.recruitmentservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entité représentant un entretien planifié pour une candidature.
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

    /** Candidature associée */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "application_id", nullable = false)
    @JsonIgnore
    private Application application;

    /** ID de la candidature (pour la sérialisation) */
    @Column(name = "application_id", insertable = false, updatable = false)
    private Long applicationId;

    /** Date et heure prévues de l'entretien */
    @Column(nullable = false)
    private LocalDateTime scheduledDate;

    /** Nom de l'intervieweur */
    @Column(nullable = false)
    private String interviewer;

    /** Notes / compte-rendu de l'entretien */
    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Résultat de l'entretien (POSITIF, NÉGATIF, EN_COURS) */
    private String result;
}
