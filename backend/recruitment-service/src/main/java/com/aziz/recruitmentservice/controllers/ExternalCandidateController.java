package com.aziz.recruitmentservice.controllers;

import com.aziz.recruitmentservice.dto.ExternalCandidateRequest;
import com.aziz.recruitmentservice.entities.ExternalCandidate;
import com.aziz.recruitmentservice.services.ExternalCandidateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CRUD du pool de candidats externes (LinkedIn / cooptation / manuel).
 * Réservé au RH Admin.
 */
@RestController
@RequestMapping("/api/external-candidates")
public class ExternalCandidateController {

    private final ExternalCandidateService service;

    public ExternalCandidateController(ExternalCandidateService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<ExternalCandidate>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<ExternalCandidate> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<ExternalCandidate> create(@RequestBody ExternalCandidateRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<ExternalCandidate> update(@PathVariable Long id,
                                                     @RequestBody ExternalCandidateRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
