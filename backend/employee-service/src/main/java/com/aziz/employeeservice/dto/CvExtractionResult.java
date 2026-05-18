package com.aziz.employeeservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Résultat complet de l'extraction d'un CV : compétences détectées + statistiques.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvExtractionResult {
    /** Compétences détectées, triées par confidence décroissante */
    private List<ExtractedSkill> skills;
    /** Nombre total de caractères extraits du CV (sanity check) */
    private int textLength;
    /** Années d'expérience totales détectées (max trouvé dans le CV) */
    private Integer estimatedYearsOfExperience;
    /** Nom de fichier d'origine */
    private String fileName;
}
