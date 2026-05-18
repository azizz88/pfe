package com.aziz.recruitmentservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Payload recu depuis le frontend pour creer/modifier une offre d'emploi.
 * skillIds remplace l'ancien champ texte requiredSkills : le frontend envoie
 * les IDs des competences, le service les resout via SkillRepository.
 * skillLevels (optionnel) : niveau requis par skillId (1-5), utilisé pour le matching IA.
 */
@Data
@NoArgsConstructor
public class JobOfferRequest {
    private String title;
    private String description;
    private String department;
    private LocalDate deadline;
    private List<Long> skillIds = new ArrayList<>();
    /** Niveau requis (1-5) par skillId. Si absent pour un skill, défaut = 3. */
    private Map<Long, Integer> skillLevels = new HashMap<>();
}
