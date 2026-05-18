package com.aziz.recruitmentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Payload pour le bulk update des statuts après matching IA validé par le RH.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusUpdateRequest {
    private List<Item> updates = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private Long applicationId;
        /** Nouveau statut : EN_ATTENTE, ENTRETIEN, RETENU, REFUSE */
        private String status;
        /** Catégorie du matching (IDEAL/TRAINING/EXTERNAL) — persistée pour la vue Pipeline */
        private String matchingCategory;
        /** Score du matching (0-100) — persisté pour la vue Pipeline */
        private Double matchingScore;
    }
}
