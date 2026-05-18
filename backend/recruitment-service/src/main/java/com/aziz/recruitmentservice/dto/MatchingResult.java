package com.aziz.recruitmentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Résultat de matching pour un candidat sur une offre d'emploi.
 *
 * Catégories :
 *  - IDEAL    (score >= 80) → candidat retenu pour le workflow standard
 *  - TRAINING (60 <= score < 80) → recommandation de formation sur les skill gaps
 *  - EXTERNAL (score < 60) → recommander recrutement externe (LinkedIn / scraping)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingResult {
    /** ID de la candidature (Application) — nécessaire pour le bulk update */
    private Long applicationId;

    private String employeeMatricule;
    private String applicantName;

    /** Score global pondéré (0-100) */
    private double score;

    /** Sous-score compétences (0-100) */
    private double skillsScore;

    /** Sous-score ancienneté (0-100) */
    private double seniorityScore;

    /** Catégorie : IDEAL, TRAINING, EXTERNAL */
    private String category;

    /** Compétences manquantes ou insuffisantes — utile pour le module formation */
    private List<SkillGap> gaps;

    /** Statut actuel de la candidature (EN_ATTENTE, ENTRETIEN, RETENU, REFUSE) */
    private String currentStatus;

    /**
     * Statut proposé par l'IA selon la catégorie de matching :
     *   IDEAL/TRAINING → ENTRETIEN
     *   EXTERNAL       → REFUSE
     * Si currentStatus ≠ EN_ATTENTE, proposedStatus = null (déjà tranché par le RH).
     */
    private String proposedStatus;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillGap {
        private Long skillId;
        private String skillName;
        private Integer requiredLevel;
        private Integer actualLevel; // null si compétence absente
    }
}
