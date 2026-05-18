package com.aziz.recruitmentservice.controllers;

import com.aziz.recruitmentservice.dto.MatchingResponse;
import com.aziz.recruitmentservice.dto.StatusUpdateRequest;
import com.aziz.recruitmentservice.services.MatchingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoint de matching IA : retourne les candidats classés par score
 * pour une offre d'emploi donnée. Réservé au RH Admin.
 */
@RestController
@RequestMapping("/api/matching")
public class MatchingController {

    private final MatchingService matchingService;

    public MatchingController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    /**
     * Lance le matching pour une offre.
     * Retourne la liste des candidats triés par score décroissant
     * avec catégorie (IDEAL / TRAINING / EXTERNAL) et skill gaps.
     */
    @PostMapping("/job-offer/{offerId}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<MatchingResponse> runMatching(
            @PathVariable Long offerId,
            @AuthenticationPrincipal Jwt jwt) {
        String token = jwt != null ? jwt.getTokenValue() : null;
        return ResponseEntity.ok(matchingService.matchCandidatesForOffer(offerId, token));
    }

    /**
     * Applique en bulk les statuts validés par le RH après matching.
     * Body : { updates: [ { applicationId, status }, ... ] }
     */
    @PostMapping("/apply-statuses")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Map<String, Object>> applyStatuses(@RequestBody StatusUpdateRequest request) {
        int count = matchingService.applyStatusUpdates(request);
        return ResponseEntity.ok(Map.of(
                "updated", count,
                "total", request.getUpdates() != null ? request.getUpdates().size() : 0
        ));
    }

    /**
     * Marque une candidature comme "à former" : flag trainingRecommended=true + timestamp.
     * Utilisé pour les candidats catégorie TRAINING : pipeline de formation interne.
     */
    @PostMapping("/recommend-training/{applicationId}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Map<String, Object>> recommendTraining(@PathVariable Long applicationId) {
        boolean ok = matchingService.recommendTraining(applicationId);
        return ResponseEntity.ok(Map.of("success", ok, "applicationId", applicationId));
    }
}
