package com.aziz.employeeservice.dto;

import com.aziz.employeeservice.entities.Contract;
import com.aziz.employeeservice.entities.Department;
import com.aziz.employeeservice.entities.ServiceEntity;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO pour la création d'un employé.
 * Contient les champs de l'entité Employee + les champs Keycloak (non persistés).
 */
@Getter
@Setter
public class EmployeeCreateRequest {

    // ── Informations personnelles ──
    private String matricule;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String position;
    private LocalDate hireDate;

    // ── Affectation (objets complets envoyés par le frontend) ──
    private Department department;
    private ServiceEntity service;
    private Contract contract;

    // ── Keycloak (non persistés dans la BDD) ──
    /** Rôle Keycloak à assigner : "EMPLOYEE" ou "HR_ADMIN" */
    private String keycloakRole = "EMPLOYEE";

    /**
     * Si true, un email d'activation est envoyé à l'employé pour qu'il définisse son mot de passe.
     * Si false, l'HR admin doit gérer l'authentification manuellement.
     */
    private boolean sendActivationEmail = true;

    /**
     * Compétences pré-validées (par exemple issues de l'extraction CV par IA).
     * Optionnel : peuvent être ajoutées plus tard via /api/employees/matricule/{m}/skills.
     */
    private List<InitialSkillRequest> initialSkills = new ArrayList<>();

    /** Compétence initiale à assigner lors de la création (sous-DTO). */
    @Getter
    @Setter
    public static class InitialSkillRequest {
        private Long skillId;
        private String skillName;
        private String category;
        private Integer level;
    }
}
