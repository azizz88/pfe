package com.aziz.employeeservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/**
 * Compétence d'un employé avec son niveau de maîtrise.
 * skillId référence l'entité Skill du recruitment-service (pas de FK cross-DB).
 * skillName et category sont dénormalisés pour éviter l'appel cross-service en lecture.
 */
@Entity
@Table(name = "employee_skills", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"employee_id", "skill_id"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EmployeeSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnore
    private Employee employee;

    /** ID de la compétence (référence vers recruitment-service.skills.id) */
    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    /** Nom dénormalisé pour affichage */
    @Column(nullable = false, length = 120)
    private String skillName;

    /** Catégorie dénormalisée */
    @Column(length = 80)
    private String category;

    /** Niveau de maîtrise : 1 (débutant) à 5 (expert) */
    @Column(nullable = false)
    private Integer level;
}
