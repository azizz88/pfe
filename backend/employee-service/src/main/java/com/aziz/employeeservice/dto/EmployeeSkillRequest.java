package com.aziz.employeeservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload pour assigner ou modifier une compétence d'un employé.
 */
@Data
@NoArgsConstructor
public class EmployeeSkillRequest {
    /** ID de la compétence (référence vers recruitment-service.skills.id) */
    private Long skillId;
    /** Nom dénormalisé */
    private String skillName;
    /** Catégorie dénormalisée */
    private String category;
    /** Niveau de maîtrise : 1 à 5 */
    private Integer level;
}
