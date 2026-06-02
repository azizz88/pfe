package com.aziz.recruitmentservice.controllers;

import com.aziz.recruitmentservice.dto.TrainingProviderRequest;
import com.aziz.recruitmentservice.entities.ConventionStatus;
import com.aziz.recruitmentservice.entities.DeliveryMode;
import com.aziz.recruitmentservice.entities.TrainingProvider;
import com.aziz.recruitmentservice.services.TrainingProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/training-providers")
@RequiredArgsConstructor
public class TrainingProviderController {

    private final TrainingProviderService service;

    /** Liste avec filtres optionnels (convention, mode, skills). HR_ADMIN + MANAGER (manager doit pouvoir consulter pour proposer). */
    @GetMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'MANAGER')")
    public ResponseEntity<List<TrainingProvider>> list(
            @RequestParam(required = false) ConventionStatus convention,
            @RequestParam(required = false) DeliveryMode mode,
            @RequestParam(required = false) List<Long> skillIds) {
        if (skillIds != null && !skillIds.isEmpty()) {
            return ResponseEntity.ok(service.findBySkillIds(skillIds));
        }
        if (convention != null) {
            return ResponseEntity.ok(service.findByConventionStatus(convention));
        }
        if (mode != null) {
            return ResponseEntity.ok(service.findByDeliveryMode(mode));
        }
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'MANAGER')")
    public ResponseEntity<TrainingProvider> getOne(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<?> create(@RequestBody TrainingProviderRequest req) {
        try {
            return ResponseEntity.ok(service.create(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody TrainingProviderRequest req) {
        try {
            return ResponseEntity.ok(service.update(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
