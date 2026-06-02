package com.aziz.employeeservice.controllers;

import com.aziz.employeeservice.dto.EmployeeCreateRequest;
import com.aziz.employeeservice.dto.EmployeeSkillRequest;
import com.aziz.employeeservice.entities.Employee;
import com.aziz.employeeservice.entities.EmployeeSkill;
import com.aziz.employeeservice.entities.ContractType;
import com.aziz.employeeservice.entities.PositionHistory;
import com.aziz.employeeservice.entities.PositionHistoryReason;
import com.aziz.employeeservice.services.EmployeeService;
import com.aziz.employeeservice.services.EmployeeSkillService;
import com.aziz.employeeservice.services.KeycloakUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la gestion des employés.
 * Les endpoints sont protégés par rôle via @PreAuthorize.
 */
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final EmployeeSkillService skillService;
    private final KeycloakUserService keycloakUserService;

    public EmployeeController(EmployeeService employeeService,
                              EmployeeSkillService skillService,
                              KeycloakUserService keycloakUserService) {
        this.employeeService = employeeService;
        this.skillService = skillService;
        this.keycloakUserService = keycloakUserService;
    }

    /**
     * Liste les utilisateurs ayant le rôle Keycloak MANAGER.
     * Utilisé par le RH lors de la planification d'un entretien pour choisir le manager assigné.
     */
    @GetMapping("/managers")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<Map<String, String>>> getManagers() {
        return ResponseEntity.ok(keycloakUserService.listUsersByRole("MANAGER"));
    }


    // =============================================
    // Endpoints EMPLOYÉ (accessible aux deux rôles)
    // =============================================

    /**
     * Récupère le profil personnel de l'employé connecté.
     * Utilise le token JWT pour identifier l'utilisateur.
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE', 'MANAGER')")
    public ResponseEntity<Employee> getMyProfile(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        return employeeService.getMyProfile(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Annuaire de l'entreprise : liste tous les employés.
     */
    @GetMapping("/directory")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<Employee>> getDirectory() {
        return ResponseEntity.ok(employeeService.getDirectory());
    }

    /**
     * Recherche dans l'annuaire par nom ou prénom.
     */
    @GetMapping("/directory/search")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<Employee>> searchDirectory(@RequestParam String keyword) {
        return ResponseEntity.ok(employeeService.searchDirectory(keyword));
    }

    // =============================================
    // Endpoints RH ADMIN uniquement
    // =============================================

    /** Liste tous les employés (vue admin complète) */
    @GetMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    /** Récupère un employé par son ID */
    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable Long id) {
        return employeeService.getEmployeeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Récupère un employé par son matricule */
    @GetMapping("/matricule/{matricule}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Employee> getByMatricule(@PathVariable String matricule) {
        return employeeService.getEmployeeByMatricule(matricule)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Résout un employé par clé : essaie matricule puis keycloakUsername.
     * Utilisé par le matching IA (la table applications stocke parfois le username au lieu du matricule).
     */
    @GetMapping("/lookup/{key}")
    @PreAuthorize("hasAnyRole('HR_ADMIN','EMPLOYEE')")
    public ResponseEntity<Employee> lookupEmployee(@PathVariable String key) {
        return employeeService.getEmployeeByMatricule(key)
                .or(() -> employeeService.getMyProfile(key))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Liste les compétences d'un employé via une clé (matricule ou keycloakUsername).
     * Compagnon de /lookup/{key} pour le matching IA cross-service.
     */
    @GetMapping("/lookup/{key}/skills")
    @PreAuthorize("hasAnyRole('HR_ADMIN','EMPLOYEE')")
    public ResponseEntity<List<EmployeeSkill>> lookupSkills(@PathVariable String key) {
        return employeeService.getEmployeeByMatricule(key)
                .or(() -> employeeService.getMyProfile(key))
                .map(emp -> ResponseEntity.ok(skillService.getSkillsByMatricule(emp.getMatricule())))
                .orElse(ResponseEntity.ok(java.util.Collections.emptyList()));
    }

    /** Crée un nouvel employé (et son compte Keycloak) */
    @PostMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Employee> createEmployee(@RequestBody EmployeeCreateRequest request) {
        return ResponseEntity.ok(employeeService.createEmployee(request));
    }

    /** Met à jour un employé */
    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id, @RequestBody Employee employee) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, employee));
    }

    /**
     * Met à jour le poste d'un employé (par matricule) <b>et enregistre l'historique de carrière</b>.
     * Utilisé par recruitment-service quand le manager valide un entretien (POSITIF) :
     * le candidat retenu est promu au titre de l'offre.
     *
     * <p>Body :
     * <pre>{
     *   "position": "Nouveau poste",            // requis
     *   "reason": "PROMOTION|MOBILITY|...",     // optionnel (défaut REASSIGNMENT)
     *   "sourceApplicationId": 42,              // optionnel — lien vers candidature
     *   "validatedByManagerName": "F. Dupont",  // optionnel — manager validateur
     *   "notes": "..."                          // optionnel — contexte libre
     * }</pre>
     */
    @PutMapping("/matricule/{matricule}/position")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'MANAGER')")
    public ResponseEntity<Employee> updatePosition(@PathVariable String matricule,
                                                   @RequestBody Map<String, Object> body) {
        Object positionRaw = body.get("position");
        if (!(positionRaw instanceof String) || ((String) positionRaw).isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String position = ((String) positionRaw).trim();

        PositionHistoryReason reason = PositionHistoryReason.REASSIGNMENT;
        Object reasonRaw = body.get("reason");
        if (reasonRaw instanceof String && !((String) reasonRaw).isBlank()) {
            try { reason = PositionHistoryReason.valueOf(((String) reasonRaw).toUpperCase()); }
            catch (IllegalArgumentException ignored) { /* fallback REASSIGNMENT */ }
        }

        Long sourceApplicationId = null;
        Object sa = body.get("sourceApplicationId");
        if (sa instanceof Number) sourceApplicationId = ((Number) sa).longValue();
        else if (sa instanceof String && !((String) sa).isBlank()) {
            try { sourceApplicationId = Long.parseLong((String) sa); } catch (NumberFormatException ignored) {}
        }

        String validatedBy = body.get("validatedByManagerName") instanceof String
                ? (String) body.get("validatedByManagerName") : null;
        String notes = body.get("notes") instanceof String ? (String) body.get("notes") : null;

        return ResponseEntity.ok(employeeService.updatePosition(
                matricule, position, reason, sourceApplicationId, validatedBy, notes));
    }

    /**
     * Historique de carrière de l'employé connecté (timeline "Mon parcours").
     * Le plus récent (poste actuel) est en tête de liste.
     */
    @GetMapping("/me/position-history")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE', 'MANAGER')")
    public ResponseEntity<List<PositionHistory>> getMyPositionHistory(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        return ResponseEntity.ok(employeeService.getPositionHistory(username));
    }

    /** Historique de carrière d'un employé donné (vue RH/Manager). */
    @GetMapping("/matricule/{matricule}/position-history")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'MANAGER')")
    public ResponseEntity<List<PositionHistory>> getPositionHistory(@PathVariable String matricule) {
        return ResponseEntity.ok(employeeService.getPositionHistory(matricule));
    }

    /**
     * Contexte "Mon équipe" du manager connecté.
     * Renvoie : departments (gérés), team (employés rattachés hors lui-même), teamSize.
     * Chaque membre porte un flag {@code recentPromotion=true} si sa dernière ligne d'historique
     * est une PROMOTION datant de moins de 30 jours (badge visuel côté UI).
     */
    @GetMapping("/manager/my-team")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getMyTeam(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        return ResponseEntity.ok(employeeService.getManagerTeamContext(username));
    }

    /** Supprime un employé */
    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    /** Filtre les employés par département */
    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<Employee>> getByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(employeeService.getEmployeesByDepartment(departmentId));
    }

    /** Filtre les employés par type de contrat */
    @GetMapping("/contract-type/{type}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<Employee>> getByContractType(@PathVariable ContractType type) {
        return ResponseEntity.ok(employeeService.getEmployeesByContractType(type));
    }

    /** Statistiques pour le dashboard RH Admin */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(employeeService.getDashboardStats());
    }

    // =============================================
    // Organigramme
    // =============================================

    /** Retourne l'organigramme de l'entreprise (départements + employés) */
    @GetMapping("/organigramme")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE', 'MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getOrganigramme() {
        return ResponseEntity.ok(employeeService.getOrganigramme());
    }

    // =============================================
    // Compétences de l'employé (utilisées par le matching IA)
    // =============================================

    /** Liste les compétences d'un employé (par matricule) */
    @GetMapping("/matricule/{matricule}/skills")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<EmployeeSkill>> getSkills(@PathVariable String matricule) {
        return ResponseEntity.ok(skillService.getSkillsByMatricule(matricule));
    }

    /**
     * Ajoute ou met à jour (upsert) une compétence pour l'employé.
     * Ouvert au MANAGER pour permettre le suivi des compétences pendant une formation
     * (page /manager/formation). L'authz fine "ce manager pilote-t-il bien cet employé"
     * est laissée à la v2 — le manager n'utilise cette route que via son écran formation.
     */
    @PostMapping("/matricule/{matricule}/skills")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'MANAGER')")
    public ResponseEntity<EmployeeSkill> addSkill(@PathVariable String matricule,
                                                  @RequestBody EmployeeSkillRequest req) {
        return ResponseEntity.ok(skillService.addOrUpdateSkill(matricule, req));
    }

    /** Modifie le niveau d'une compétence existante. Ouvert au MANAGER (suivi formation). */
    @PutMapping("/matricule/{matricule}/skills/{skillId}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'MANAGER')")
    public ResponseEntity<EmployeeSkill> updateSkillLevel(@PathVariable String matricule,
                                                          @PathVariable Long skillId,
                                                          @RequestBody EmployeeSkillRequest req) {
        return ResponseEntity.ok(skillService.updateLevel(matricule, skillId, req.getLevel()));
    }

    /** Retire une compétence de l'employé */
    @DeleteMapping("/matricule/{matricule}/skills/{skillId}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Void> removeSkill(@PathVariable String matricule,
                                            @PathVariable Long skillId) {
        skillService.removeSkill(matricule, skillId);
        return ResponseEntity.noContent().build();
    }
}
