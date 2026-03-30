package com.aziz.recruitmentservice.controllers;

import com.aziz.recruitmentservice.entities.Interview;
import com.aziz.recruitmentservice.services.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des entretiens.
 * Réservé aux RH Admin.
 */
@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }


    /** Planifie un entretien */
    @PostMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Interview> scheduleInterview(@RequestBody Interview interview) {
        return ResponseEntity.ok(interviewService.scheduleInterview(interview));
    }

    /** Liste les entretiens d'une candidature */
    @GetMapping("/application/{applicationId}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<Interview>> getByApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(interviewService.getInterviewsByApplication(applicationId));
    }

    /** Récupère un entretien par son ID */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Interview> getInterviewById(@PathVariable Long id) {
        return interviewService.getInterviewById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Met à jour un entretien (notes, résultat) */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Interview> updateInterview(@PathVariable Long id, @RequestBody Interview interview) {
        return ResponseEntity.ok(interviewService.updateInterview(id, interview));
    }
}
