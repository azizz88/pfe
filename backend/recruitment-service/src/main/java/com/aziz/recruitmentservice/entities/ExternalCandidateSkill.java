package com.aziz.recruitmentservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/**
 * Compétence d'un candidat externe avec niveau de maîtrise (1-5).
 * Miroir de EmployeeSkill côté employee-service — alimente le moteur de matching IA.
 */
@Entity
@Table(name = "external_candidate_skills",
       uniqueConstraints = @UniqueConstraint(columnNames = {"candidate_id", "skill_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ExternalCandidateSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    @JsonIgnore
    private ExternalCandidate candidate;

    /** ID de la compétence dans le catalogue Skill (recruitment-service) */
    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    /** Nom (dénormalisé pour faciliter l'affichage sans jointure) */
    @Column(name = "skill_name", nullable = false)
    private String skillName;

    /** Catégorie (dénormalisée) */
    private String category;

    /** Niveau 1-5 */
    @Column(nullable = false)
    private Integer level;
}
