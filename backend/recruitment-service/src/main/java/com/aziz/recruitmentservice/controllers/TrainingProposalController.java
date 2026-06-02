package com.aziz.recruitmentservice.controllers;

import com.aziz.recruitmentservice.dto.TrainingProposalCreateRequest;
import com.aziz.recruitmentservice.entities.TrainingProposal;
import com.aziz.recruitmentservice.services.TrainingProposalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints pour le workflow des propositions de formation.
 * Identité résolue depuis le JWT (preferred_username pour le manager,
 * matricule pour l'employé via claim custom ou preferred_username selon ton mapping Keycloak).
 */
@RestController
@RequestMapping("/api/training/proposals")
@RequiredArgsConstructor
@Slf4j
public class TrainingProposalController {

    private final TrainingProposalService service;

    // ===================================================
    // Lectures
    // ===================================================

    /** Vue HR Admin globale. */
    @GetMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<TrainingProposal>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /** Pipeline du manager connecté. */
    @GetMapping("/manager")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TrainingProposal>> getForManager(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.getByManager(jwt.getClaim("preferred_username")));
    }

    /** Stats du manager connecté (compteurs par statut). */
    @GetMapping("/manager/stats")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Long>> getManagerStats(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.getManagerStats(jwt.getClaim("preferred_username")));
    }

    /** Propositions reçues par l'employé connecté. */
    @GetMapping("/employee")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<TrainingProposal>> getForEmployee(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.getByEmployee(resolveEmployeeMatricule(jwt)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<?> getOne(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ===================================================
    // Création (manager)
    // ===================================================

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> create(@RequestBody TrainingProposalCreateRequest req,
                                    @AuthenticationPrincipal Jwt jwt) {
        try {
            String username = jwt.getClaim("preferred_username");
            String name = jwt.hasClaim("name") ? jwt.getClaim("name") : username;
            return ResponseEntity.ok(service.create(req, username, name));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===================================================
    // Transitions employé
    // ===================================================

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<?> accept(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return handleTransition(() -> service.accept(id, resolveEmployeeMatricule(jwt)));
    }

    @PostMapping("/{id}/refuse")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<?> refuse(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return handleTransition(() -> service.refuse(id, resolveEmployeeMatricule(jwt)));
    }

    // ===================================================
    // Transitions manager
    // ===================================================

    @PostMapping("/{id}/enroll")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> enroll(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return handleTransition(() -> service.enroll(id, jwt.getClaim("preferred_username")));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> complete(@PathVariable Long id,
                                       @RequestBody(required = false) Map<String, String> body,
                                       @AuthenticationPrincipal Jwt jwt) {
        String certificateUrl = body == null ? null : body.get("certificateUrl");
        String token = jwt != null ? jwt.getTokenValue() : null;
        return handleTransition(() -> service.complete(id, jwt.getClaim("preferred_username"), certificateUrl, token));
    }

    @PostMapping("/{id}/abandon")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> abandon(@PathVariable Long id,
                                      @RequestBody(required = false) Map<String, String> body,
                                      @AuthenticationPrincipal Jwt jwt) {
        String reason = body == null ? null : body.get("reason");
        return handleTransition(() -> service.abandon(id, jwt.getClaim("preferred_username"), reason));
    }

    // ===================================================
    // Helpers
    // ===================================================

    /**
     * Résout le matricule de l'employé connecté depuis le JWT.
     * Priorité : claim "matricule" si présent, sinon preferred_username.
     * À ajuster selon le mapping Keycloak du projet.
     */
    private String resolveEmployeeMatricule(Jwt jwt) {
        if (jwt.hasClaim("matricule")) return jwt.getClaim("matricule");
        return jwt.getClaim("preferred_username");
    }

    private ResponseEntity<?> handleTransition(java.util.function.Supplier<TrainingProposal> action) {
        try {
            return ResponseEntity.ok(action.get());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }
}
