package com.aziz.recruitmentservice.controllers;

import com.aziz.recruitmentservice.dto.JobOfferRequest;
import com.aziz.recruitmentservice.entities.JobOffer;
import com.aziz.recruitmentservice.services.JobOfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des offres d'emploi.
 */
@RestController
@RequestMapping("/api/job-offers")
public class JobOfferController {

    private final JobOfferService jobOfferService;

    public JobOfferController(JobOfferService jobOfferService) {
        this.jobOfferService = jobOfferService;
    }


    /** Liste les offres actives (accessible aux employés) */
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<JobOffer>> getActiveOffers() {
        return ResponseEntity.ok(jobOfferService.getActiveOffers());
    }

    /** Liste toutes les offres (RH Admin) */
    @GetMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<JobOffer>> getAllOffers() {
        return ResponseEntity.ok(jobOfferService.getAllOffers());
    }

    /** Récupère une offre par son ID */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<JobOffer> getOfferById(@PathVariable Long id) {
        return jobOfferService.getOfferById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Crée une nouvelle offre d'emploi (RH Admin) */
    @PostMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<JobOffer> createOffer(@RequestBody JobOfferRequest request) {
        return ResponseEntity.ok(jobOfferService.createOffer(request));
    }

    /** Met à jour une offre (RH Admin) */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<JobOffer> updateOffer(@PathVariable Long id, @RequestBody JobOfferRequest request) {
        return ResponseEntity.ok(jobOfferService.updateOffer(id, request));
    }

    /** Clôture une offre (RH Admin) */
    @PutMapping("/{id}/close")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<JobOffer> closeOffer(@PathVariable Long id) {
        return ResponseEntity.ok(jobOfferService.closeOffer(id));
    }

    /** Supprime une offre (RH Admin) */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Void> deleteOffer(@PathVariable Long id) {
        jobOfferService.deleteOffer(id);
        return ResponseEntity.noContent().build();
    }
}
