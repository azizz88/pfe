package com.aziz.employeeservice.services;

import com.aziz.employeeservice.entities.Employee;
import com.aziz.employeeservice.entities.ContractType;
import com.aziz.employeeservice.repositories.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service métier pour la gestion des employés.
 * Contient la logique pour les espaces Employé et RH Admin.
 */
@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }


    // =============================================
    // Méthodes accessibles par les EMPLOYÉS
    // =============================================

    /**
     * Récupère le profil d'un employé via son username Keycloak.
     * Utilisé par l'employé pour consulter son propre profil.
     */
    public Optional<Employee> getMyProfile(String keycloakUsername) {
        return employeeRepository.findByKeycloakUsername(keycloakUsername);
    }

    /**
     * Annuaire : liste tous les employés (infos de base).
     * Accessible par tous les employés authentifiés.
     */
    @Transactional(readOnly = true)
    public List<Employee> getDirectory() {
        return employeeRepository.findAll();
    }

    /**
     * Recherche dans l'annuaire par nom ou prénom.
     */
    @Transactional(readOnly = true)
    public List<Employee> searchDirectory(String keyword) {
        return employeeRepository.searchByName(keyword);
    }

    // =============================================
    // Méthodes réservées aux RH ADMIN
    // =============================================

    /** Liste tous les employés */
    @Transactional(readOnly = true)
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    /** Récupère un employé par son ID */
    @Transactional(readOnly = true)
    public Optional<Employee> getEmployeeById(Long id) {
        return employeeRepository.findById(id);
    }

    /** Récupère un employé par son matricule */
    @Transactional(readOnly = true)
    public Optional<Employee> getEmployeeByMatricule(String matricule) {
        return employeeRepository.findByMatricule(matricule);
    }

    /** Crée un nouvel employé */
    public Employee createEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    /** Met à jour un employé existant */
    public Employee updateEmployee(Long id, Employee employeeDetails) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'ID: " + id));

        employee.setFirstName(employeeDetails.getFirstName());
        employee.setLastName(employeeDetails.getLastName());
        employee.setEmail(employeeDetails.getEmail());
        employee.setPhone(employeeDetails.getPhone());
        employee.setPosition(employeeDetails.getPosition());
        employee.setHireDate(employeeDetails.getHireDate());
        employee.setDepartment(employeeDetails.getDepartment());
        employee.setContract(employeeDetails.getContract());
        employee.setKeycloakUsername(employeeDetails.getKeycloakUsername());

        return employeeRepository.save(employee);
    }

    /** Supprime un employé */
    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }

    /** Liste les employés d'un département */
    @Transactional(readOnly = true)
    public List<Employee> getEmployeesByDepartment(Long departmentId) {
        return employeeRepository.findByDepartmentId(departmentId);
    }

    /** Liste les employés par type de contrat */
    @Transactional(readOnly = true)
    public List<Employee> getEmployeesByContractType(ContractType type) {
        return employeeRepository.findByContractType(type);
    }

    // =============================================
    // Statistiques pour le Dashboard RH
    // =============================================

    /** Statistiques globales pour le dashboard RH Admin */
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Nombre total d'employés
        stats.put("totalEmployees", employeeRepository.count());

        // Répartition par département
        Map<String, Long> byDepartment = new HashMap<>();
        for (Object[] row : employeeRepository.countByDepartment()) {
            byDepartment.put((String) row[0], (Long) row[1]);
        }
        stats.put("byDepartment", byDepartment);

        // Répartition par type de contrat
        Map<String, Long> byContractType = new HashMap<>();
        for (Object[] row : employeeRepository.countByContractType()) {
            byContractType.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("byContractType", byContractType);

        return stats;
    }
}
