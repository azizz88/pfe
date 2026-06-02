package com.aziz.recruitmentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Vue consolidée d'un programme de formation pour les pages /manager/formation et /employee/formation.
 *
 * <p>S'appuie sur un {@link com.aziz.recruitmentservice.entities.Interview} existant ayant
 * {@code trainingRecommendedAt != null}, enrichi des compétences cibles de l'offre et des
 * niveaux actuels de l'employé. Aucune nouvelle entité — version simple v1.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingProgramView {

    private Long interviewId;
    private Long applicationId;

    private String candidateName;
    private String candidateMatricule;
    private String candidateEmail;

    private Long jobOfferId;
    private String jobOfferTitle;

    private String managerUsername;
    private String managerName;
    private String managerEmail;

    /** Plan rédigé par le manager (texte libre). */
    private String trainingPlan;
    /** Durée estimée (texte libre : "2 semaines", "3 mois"...). */
    private String trainingDuration;
    /** Notes/conseils complémentaires du manager. */
    private String trainingNotes;
    /** Horodatage de la recommandation = date de démarrage de la formation. */
    private LocalDateTime trainingRecommendedAt;

    /** Score initial du matching IA (à la création de la candidature). */
    private Double baselineScore;

    /** Compétences ciblées avec niveau actuel vs niveau requis. */
    private List<TrainingSkillView> skills;

    /** Calculé : nombre de compétences acquises (currentLevel >= requiredLevel). */
    private int skillsAcquired;
    /** Calculé : nombre total de compétences ciblées. */
    private int skillsTotal;
    /** Calculé : true si toutes les compétences sont au niveau requis. */
    private boolean readyForInterview;

    /** Statut de l'entretien associé (pour filtrer les terminés côté UI). */
    private String interviewStatus;
    /** Résultat de l'entretien si déjà passé (POSITIF/NEGATIF/EN_COURS). */
    private String interviewResult;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrainingSkillView {
        private Long skillId;
        private String skillName;
        /** Niveau requis par l'offre (1-5). */
        private Integer requiredLevel;
        /** Niveau actuel de l'employé (1-5), null si compétence absente. */
        private Integer currentLevel;
        /** Vrai si currentLevel != null et currentLevel >= requiredLevel. */
        private boolean acquired;
    }
}
