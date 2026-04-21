package com.aziz.recruitmentservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Payload recu depuis le frontend pour creer/modifier une offre d'emploi.
 * skillIds remplace l'ancien champ texte requiredSkills : le frontend envoie
 * les IDs des competences, le service les resout via SkillRepository.
 */
@Data
@NoArgsConstructor
public class JobOfferRequest {
    private String title;
    private String description;
    private String department;
    private LocalDate deadline;
    private List<Long> skillIds = new ArrayList<>();
}
