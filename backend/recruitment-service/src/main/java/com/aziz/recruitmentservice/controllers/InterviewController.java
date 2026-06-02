package com.aziz.recruitmentservice.controllers;

import com.aziz.recruitmentservice.dto.TrainingProgramView;
import com.aziz.recruitmentservice.entities.Interview;
import com.aziz.recruitmentservice.services.InterviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des entretiens.
 * - RH Admin : planification, vue globale, modification de tout entretien.
 * - MANAGER  : vue/modification de ses propres entretiens uniquement.
 */
@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    /** Liste tous les entretiens (vue RH Admin globale). */
    @GetMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<Interview>> getAll() {
        return ResponseEntity.ok(interviewService.getAllInterviews());
    }

    /** Liste les entretiens assignés au manager connecté. */
    @GetMapping("/my")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<Interview>> getMyInterviews(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        return ResponseEntity.ok(interviewService.getInterviewsByManager(username));
    }

    /**
     * Statistiques d'activité du manager connecté (KPIs dashboard).
     * Renvoie : compteurs par statut, par résultat, taux d'acceptation,
     * activité mensuelle sur 6 mois, et les 5 prochains entretiens planifiés.
     */
    @GetMapping("/manager/stats")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<java.util.Map<String, Object>> getMyStats(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        return ResponseEntity.ok(interviewService.getManagerStats(username));
    }

    /**
     * Phase 1 — Affecte un manager à un entretien (RH Admin).
     * Le payload contient : applicationId OU externalCandidateId, managerUsername, managerName, rhNote (optionnel).
     * Aucune date n'est attendue : le manager la fixera en phase 2 via /schedule.
     */
    @PostMapping("/assign")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<?> assignInterview(@RequestBody Interview interview,
                                             @AuthenticationPrincipal Jwt jwt) {
        try {
            String token = jwt != null ? jwt.getTokenValue() : null;
            return ResponseEntity.ok(interviewService.assignInterview(interview, token));
        } catch (RuntimeException e) {
            // Renvoie le vrai message + cause racine pour diagnostiquer côté client
            org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(InterviewController.class);
            log.error("Échec assignInterview", e);
            Throwable root = e;
            while (root.getCause() != null) root = root.getCause();
            String message = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            String rootMsg = root != e && root.getMessage() != null
                    ? " | Cause racine : " + root.getClass().getSimpleName() + " - " + root.getMessage()
                    : "";
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "message", message + rootMsg,
                    "exception", e.getClass().getName()
            ));
        }
    }

    /**
     * Phase 2 — Le manager fixe la date/heure/lieu de son entretien.
     * Body : { scheduledDate, location, interviewer }
     */
    @PutMapping("/{id}/schedule")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Interview> scheduleByManager(@PathVariable Long id,
                                                       @RequestBody SchedulePayload payload,
                                                       @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        return ResponseEntity.ok(interviewService.scheduleByManager(
                id, payload.scheduledDate, payload.location, payload.interviewer, username));
    }

    /**
     * Le manager refuse l'affectation (motif requis).
     * Body : { reason: "..." }
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Interview> rejectAssignment(@PathVariable Long id,
                                                      @RequestBody RejectPayload payload,
                                                      @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        return ResponseEntity.ok(interviewService.rejectAssignment(id, payload.reason, username));
    }

    /** DTO pour la planification phase 2. */
    public static class SchedulePayload {
        public java.time.LocalDateTime scheduledDate;
        public String location;
        public String interviewer;
    }

    /** DTO pour le refus de l'affectation. */
    public static class RejectPayload {
        public String reason;
    }

    /**
     * Recommandation de formation par le manager pour un candidat "À Former" (TRAINING).
     * Body : { trainingPlan, trainingDuration?, trainingNotes? }
     */
    @PutMapping("/{id}/training-recommendation")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Interview> recommendTraining(@PathVariable Long id,
                                                       @RequestBody TrainingPayload payload,
                                                       @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        return ResponseEntity.ok(interviewService.recommendTraining(
                id, payload.trainingPlan, payload.trainingDuration, payload.trainingNotes, username));
    }

    /** DTO pour la recommandation de formation. */
    public static class TrainingPayload {
        public String trainingPlan;
        public String trainingDuration;
        public String trainingNotes;
    }

    // ─────────────────────────────────────────────────────────────
    //  Suivi des formations (vue dédiée /manager/formation et /employee/formation)
    // ─────────────────────────────────────────────────────────────

    /**
     * Liste les programmes de formation pilotés par le manager connecté.
     * Source : Interviews du manager avec trainingRecommendedAt != null, enrichis
     * des compétences cibles de l'offre et des niveaux actuels de l'employé.
     */
    @GetMapping("/manager/training-recommendations")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TrainingProgramView>> getManagerTrainings(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        String token = jwt.getTokenValue();
        return ResponseEntity.ok(interviewService.getManagerTrainingPrograms(username, token));
    }

    /**
     * Met à jour le plan/notes/durée d'une formation en cours.
     * Variante "édition libre" — pas besoin que tous les champs soient renseignés.
     */
    @PutMapping("/{id}/training-plan")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Interview> updateTrainingPlan(@PathVariable Long id,
                                                        @RequestBody TrainingPayload payload,
                                                        @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        return ResponseEntity.ok(interviewService.updateTrainingPlan(
                id, payload.trainingPlan, payload.trainingDuration, payload.trainingNotes, username));
    }

    /**
     * Vue read-only de l'employé connecté sur ses formations en cours.
     * Cherche les Interviews dont la candidature est rattachée au matricule de l'employé.
     */
    @GetMapping("/employee/my-training")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public ResponseEntity<List<TrainingProgramView>> getMyTraining(@AuthenticationPrincipal Jwt jwt) {
        // Le matricule de l'employé est résolu côté employee-service ; ici on utilise le
        // preferred_username comme clé de lookup (l'EmployeeClient sait gérer username/matricule).
        String username = jwt.getClaim("preferred_username");
        String token = jwt.getTokenValue();
        // L'employé peut être enregistré par matricule OU par username dans Application.
        // On essaie d'abord avec le username : si l'Application a stocké le username au
        // moment du dépôt de candidature, ça match directement.
        List<TrainingProgramView> programs = interviewService.getEmployeeTrainingPrograms(username, token);
        return ResponseEntity.ok(programs);
    }

    /** Renvoyer la convocation par email (RH Admin). */
    @PostMapping("/{id}/resend-email")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Void> resendConvocation(@PathVariable Long id) {
        interviewService.resendConvocation(id);
        return ResponseEntity.noContent().build();
    }

    /** Liste les entretiens d'une candidature (RH Admin). */
    @GetMapping("/application/{applicationId}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<Interview>> getByApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(interviewService.getInterviewsByApplication(applicationId));
    }

    /**
     * Récupère un entretien par son ID.
     * Accessible au RH Admin et au manager assigné.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'MANAGER')")
    public ResponseEntity<Interview> getInterviewById(@PathVariable Long id,
                                                       @AuthenticationPrincipal Jwt jwt) {
        return interviewService.getInterviewById(id)
                .filter(i -> isHrAdmin(jwt) || isAssignedManager(i, jwt))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Met à jour un entretien.
     * - RH Admin : peut tout modifier (y compris réassigner le manager).
     * - MANAGER  : peut modifier uniquement ses propres entretiens (notes, résultat, statut, lieu).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'MANAGER')")
    public ResponseEntity<Interview> updateInterview(@PathVariable Long id,
                                                      @RequestBody Interview interview,
                                                      @AuthenticationPrincipal Jwt jwt) {
        String requester = isHrAdmin(jwt) ? null : jwt.getClaim("preferred_username");
        String token = jwt != null ? jwt.getTokenValue() : null;
        return ResponseEntity.ok(interviewService.updateInterview(id, interview, requester, token));
    }

    private boolean isHrAdmin(Jwt jwt) {
        Object realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof java.util.Map<?, ?> m) {
            Object roles = m.get("roles");
            return roles instanceof List<?> list && list.contains("HR_ADMIN");
        }
        return false;
    }

    private boolean isAssignedManager(Interview interview, Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        return username != null && username.equals(interview.getManagerUsername());
    }
}
