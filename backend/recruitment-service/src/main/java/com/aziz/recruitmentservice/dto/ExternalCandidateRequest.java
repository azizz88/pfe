package com.aziz.recruitmentservice.dto;

import com.aziz.recruitmentservice.entities.ExternalCandidateSource;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Payload de création/mise à jour d'un candidat externe.
 * Les compétences sont fournies directement (ex: pré-validées après extraction CV côté front).
 */
@Getter
@Setter
public class ExternalCandidateRequest {

    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String linkedinUrl;
    private ExternalCandidateSource source;
    private Integer yearsOfExperience;
    private String currentPosition;
    private String notes;

    /** Compétences validées (typiquement issues de /api/cv/extract puis filtrées par le RH). */
    private List<SkillItem> skills = new ArrayList<>();

    @Getter
    @Setter
    public static class SkillItem {
        private Long skillId;
        private String skillName;
        private String category;
        private Integer level;
    }
}
