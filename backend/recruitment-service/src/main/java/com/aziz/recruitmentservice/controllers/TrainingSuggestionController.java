package com.aziz.recruitmentservice.controllers;

import com.aziz.recruitmentservice.dto.TrainingSuggestion;
import com.aziz.recruitmentservice.dto.TrainingSuggestionRequest;
import com.aziz.recruitmentservice.services.TrainingSuggestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/training")
@RequiredArgsConstructor
@Slf4j
public class TrainingSuggestionController {

    private final TrainingSuggestionService service;

    /**
     * Suggère le top 3 d'organismes de formation pour des compétences manquantes.
     * Accessible MANAGER et HR_ADMIN.
     */
    @PostMapping("/suggest")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR_ADMIN')")
    public ResponseEntity<?> suggest(@RequestBody TrainingSuggestionRequest req) {
        try {
            List<TrainingSuggestion> suggestions = service.suggest(req);
            return ResponseEntity.ok(suggestions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("[Suggest] Erreur inattendue", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur lors de la suggestion : " + e.getMessage()));
        }
    }
}
