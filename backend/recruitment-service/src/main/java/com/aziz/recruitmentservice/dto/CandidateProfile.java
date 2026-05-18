package com.aziz.recruitmentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Profil simplifié d'un candidat (employé interne) consommé par le moteur de matching.
 * Construit côté recruitment-service après appel à employee-service.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateProfile {
    private String matricule;
    private String fullName;
    private LocalDate hireDate;
    private List<CandidateSkill> skills;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CandidateSkill {
        private Long skillId;
        private String skillName;
        private Integer level; // 1-5
    }
}
