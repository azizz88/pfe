package com.aziz.employeeservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Compétence détectée dans un CV par l'extraction IA.
 * skillId/skillName/category proviennent du catalogue Skill (recruitment-service).
 * Le level est estimé via regex (années d'expérience, mots-clés "expert"/"senior"/...).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractedSkill {
    private Long skillId;
    private String skillName;
    private String category;
    /** Niveau estimé (1-5) */
    private Integer level;
    /** Confiance d'extraction (0.0-1.0) — indicative pour le RH */
    private Double confidence;
    /** Extrait du CV qui a déclenché la détection (aide à la validation) */
    private String evidence;
    /** Sélectionnée par défaut dans l'UI (true si confidence haute) */
    private boolean preselected;
}
