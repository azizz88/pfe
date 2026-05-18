package com.aziz.recruitmentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Réponse complète du matching IA : résultats + diagnostic.
 * Le diagnostic permet à l'UI d'afficher un message précis si la liste est vide.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingResponse {

    private List<MatchingResult> results;
    private Diagnostic diagnostic;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Diagnostic {
        /** Titre de l'offre (pour affichage) */
        private String offerTitle;
        /** Nombre de compétences requises sur l'offre */
        private int skillRequirementsCount;
        /** Nombre de candidatures pour cette offre */
        private int applicationsCount;
        /** Nombre de candidats dont le profil employé a été chargé avec succès */
        private int profilesLoaded;
        /** Nombre de candidats ayant au moins une compétence renseignée */
        private int candidatesWithSkills;
        /** Cause principale si results vide : NO_SKILLS_ON_OFFER, NO_APPLICATIONS, NO_CANDIDATE_PROFILES, OK */
        private String reason;
    }
}
