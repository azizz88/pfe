package com.aziz.recruitmentservice.controllers;

import com.aziz.recruitmentservice.entities.Application;
import com.aziz.recruitmentservice.entities.ApplicationStatus;
import com.aziz.recruitmentservice.services.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la gestion des candidatures.
 * Gère le workflow : EN_ATTENTE → ENTRETIEN → RETENU / REFUSE
 */
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }


    // =============================================
    // Endpoints EMPLOYÉ
    // =============================================

    /** Soumettre une candidature (Employé) */
    @PostMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<Application> submitApplication(@RequestBody Application application) {
        return ResponseEntity.ok(applicationService.submitApplication(application));
    }

    /** Mes candidatures : historique personnel (Employé) */
    @GetMapping("/my/{matricule}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<Application>> getMyApplications(@PathVariable String matricule) {
        return ResponseEntity.ok(applicationService.getMyApplications(matricule));
    }

    // =============================================
    // Endpoints RH ADMIN
    // =============================================

    /** Liste toutes les candidatures */
    @GetMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<Application>> getAllApplications() {
        return ResponseEntity.ok(applicationService.getAllApplications());
    }

    /** Candidatures pour une offre spécifique */
    @GetMapping("/job-offer/{jobOfferId}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<Application>> getByJobOffer(@PathVariable Long jobOfferId) {
        return ResponseEntity.ok(applicationService.getApplicationsByJobOffer(jobOfferId));
    }

    /** Récupère une candidature par son ID */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Application> getApplicationById(@PathVariable Long id) {
        return applicationService.getApplicationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Change le statut d'une candidature (workflow) */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Application> updateStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status) {
        return ResponseEntity.ok(applicationService.updateStatus(id, status));
    }

    /** Rapport de mobilité interne */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Map<String, Object>> getMobilityReport() {
        return ResponseEntity.ok(applicationService.getMobilityReport());
    }
}
