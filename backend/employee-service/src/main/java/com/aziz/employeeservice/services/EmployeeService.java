package com.aziz.employeeservice.services;

import com.aziz.employeeservice.entities.Contract;
import com.aziz.employeeservice.entities.Department;
import com.aziz.employeeservice.entities.Employee;
import com.aziz.employeeservice.entities.ContractType;
import com.aziz.employeeservice.entities.ServiceEntity;
import com.aziz.employeeservice.repositories.ContractRepository;
import com.aziz.employeeservice.repositories.DepartmentRepository;
import com.aziz.employeeservice.repositories.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service métier pour la gestion des employés.
 * Contient la logique pour les espaces Employé et RH Admin.
 */
@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final ContractRepository contractRepository;

    public EmployeeService(EmployeeRepository employeeRepository,
                           DepartmentRepository departmentRepository,
                           ContractRepository contractRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.contractRepository = contractRepository;
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
        employee.setService(employeeDetails.getService());
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

        // Masse salariale
        stats.put("totalSalaryMass", employeeRepository.getTotalSalaryMass());

        Map<String, Double> salaryByDept = new HashMap<>();
        for (Object[] row : employeeRepository.getSalaryByDepartment()) {
            salaryByDept.put((String) row[0], (Double) row[1]);
        }
        stats.put("salaryByDepartment", salaryByDept);

        // Contrats expirant dans les 30 prochains jours
        List<Contract> expiring = contractRepository.findExpiringBefore(LocalDate.now().plusDays(30));
        List<Map<String, Object>> expiringList = new ArrayList<>();
        for (Contract c : expiring) {
            Map<String, Object> item = new HashMap<>();
            item.put("employeeName", c.getEmployee() != null
                    ? c.getEmployee().getFirstName() + " " + c.getEmployee().getLastName() : "—");
            item.put("type", c.getType().name());
            item.put("endDate", c.getEndDate().toString());
            expiringList.add(item);
        }
        stats.put("expiringContracts", expiringList);
        stats.put("expiringCount", expiringList.size());

        // Ancienneté moyenne (en mois)
        List<Employee> allEmployees = employeeRepository.findAll();
        long totalMonths = 0;
        int count = 0;
        for (Employee emp : allEmployees) {
            if (emp.getHireDate() != null) {
                totalMonths += ChronoUnit.MONTHS.between(emp.getHireDate(), LocalDate.now());
                count++;
            }
        }
        stats.put("averageTenureMonths", count > 0 ? totalMonths / count : 0);

        return stats;
    }

    // =============================================
    // Organigramme de l'entreprise
    // =============================================

    /** Retourne la structure organisationnelle : départements avec leurs services et employés */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOrganigramme() {
        List<Map<String, Object>> organigramme = new ArrayList<>();

        for (Department dept : departmentRepository.findAll()) {
            Map<String, Object> node = new HashMap<>();

            Map<String, Object> deptInfo = new HashMap<>();
            deptInfo.put("id", dept.getId());
            deptInfo.put("name", dept.getName());
            deptInfo.put("description", dept.getDescription());
            node.put("department", deptInfo);

            List<Employee> allDeptEmployees = employeeRepository.findByDepartmentId(dept.getId());
            int totalEmployeeCount = allDeptEmployees.size();

            // Grouper par service
            List<Map<String, Object>> servicesList = new ArrayList<>();
            for (ServiceEntity svc : dept.getServices()) {
                Map<String, Object> svcNode = new HashMap<>();
                Map<String, Object> svcInfo = new HashMap<>();
                svcInfo.put("id", svc.getId());
                svcInfo.put("name", svc.getName());
                svcInfo.put("description", svc.getDescription());
                svcNode.put("service", svcInfo);

                List<Map<String, Object>> svcEmployees = new ArrayList<>();
                for (Employee emp : allDeptEmployees) {
                    if (emp.getService() != null && emp.getService().getId().equals(svc.getId())) {
                        svcEmployees.add(mapEmployeeData(emp));
                    }
                }
                svcNode.put("employees", svcEmployees);
                svcNode.put("employeeCount", svcEmployees.size());
                servicesList.add(svcNode);
            }
            node.put("services", servicesList);

            // Employés non assignés à un service
            List<Map<String, Object>> unassignedEmployees = new ArrayList<>();
            for (Employee emp : allDeptEmployees) {
                if (emp.getService() == null) {
                    unassignedEmployees.add(mapEmployeeData(emp));
                }
            }
            node.put("unassignedEmployees", unassignedEmployees);
            node.put("totalEmployeeCount", totalEmployeeCount);

            organigramme.add(node);
        }

        return organigramme;
    }

    private Map<String, Object> mapEmployeeData(Employee emp) {
        Map<String, Object> empInfo = new HashMap<>();
        empInfo.put("id", emp.getId());
        empInfo.put("matricule", emp.getMatricule());
        empInfo.put("firstName", emp.getFirstName());
        empInfo.put("lastName", emp.getLastName());
        empInfo.put("position", emp.getPosition());
        empInfo.put("email", emp.getEmail());
        return empInfo;
    }
}
