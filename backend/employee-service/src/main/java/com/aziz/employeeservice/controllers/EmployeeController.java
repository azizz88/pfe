package com.aziz.employeeservice.controllers;

import com.aziz.employeeservice.entities.Employee;
import com.aziz.employeeservice.entities.ContractType;
import com.aziz.employeeservice.services.EmployeeService;
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

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }


    // =============================================
    // Endpoints EMPLOYÉ (accessible aux deux rôles)
    // =============================================

    /**
     * Récupère le profil personnel de l'employé connecté.
     * Utilise le token JWT pour identifier l'utilisateur.
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
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

    /** Crée un nouvel employé */
    @PostMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Employee> createEmployee(@RequestBody Employee employee) {
        return ResponseEntity.ok(employeeService.createEmployee(employee));
    }

    /** Met à jour un employé */
    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id, @RequestBody Employee employee) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, employee));
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
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<Map<String, Object>>> getOrganigramme() {
        return ResponseEntity.ok(employeeService.getOrganigramme());
    }
}
