package com.aziz.recruitmentservice.dto;

import com.aziz.recruitmentservice.entities.DeliveryMode;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Payload pour demander à l'IA de suggérer un top 3 d'organismes de formation
 * adaptés aux skills manquants d'un candidat ou employé.
 */
@Data
@NoArgsConstructor
public class TrainingSuggestionRequest {
    /** IDs des Skills à acquérir. Obligatoire. */
    private List<Long> missingSkillIds = new ArrayList<>();
    /** Budget maximum en euros (optionnel). */
    private Integer budgetMaxEur;
    /** Mode préféré (optionnel). */
    private DeliveryMode preferredMode;
    /** ID de la candidature source (optionnel — traçabilité pour P2). */
    private Long sourceApplicationId;
    /** Matricule de l'employé bénéficiaire (optionnel — traçabilité pour P2). */
    private String employeeMatricule;
}
