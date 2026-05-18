package com.aziz.employeeservice.services;

import com.aziz.employeeservice.dto.EmployeeCreateRequest;
import com.aziz.employeeservice.entities.Contract;
import com.aziz.employeeservice.entities.Department;
import com.aziz.employeeservice.entities.Employee;
import com.aziz.employeeservice.entities.EmployeeSkill;
import com.aziz.employeeservice.entities.ContractType;
import com.aziz.employeeservice.entities.ServiceEntity;
import com.aziz.employeeservice.repositories.ContractRepository;
import com.aziz.employeeservice.repositories.DepartmentRepository;
import com.aziz.employeeservice.repositories.EmployeeRepository;
import com.aziz.employeeservice.repositories.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final ContractRepository contractRepository;
    private final ServiceRepository serviceRepository;
    private final KeycloakUserService keycloakUserService;
    private final WelcomeEmailService welcomeEmailService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           DepartmentRepository departmentRepository,
                           ContractRepository contractRepository,
                           ServiceRepository serviceRepository,
                           KeycloakUserService keycloakUserService,
                           WelcomeEmailService welcomeEmailService) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.contractRepository = contractRepository;
        this.serviceRepository = serviceRepository;
        this.keycloakUserService = keycloakUserService;
        this.welcomeEmailService = welcomeEmailService;
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

    /**
     * Crée un nouvel employé avec activation par email :
     * 1. Crée l'utilisateur dans Keycloak SANS mot de passe
     * 2. Persiste l'employé en base
     * 3. Envoie un email d'activation (si sendActivationEmail = true)
     *    -> L'employé clique sur le lien et définit son propre mot de passe
     */
    public Employee createEmployee(EmployeeCreateRequest request) {
        // Génère un mot de passe temporaire et crée le user Keycloak (qui forcera le changement à la 1ère connexion)
        String tempPassword = keycloakUserService.generateTempPassword();
        String role = request.getKeycloakRole() != null ? request.getKeycloakRole() : "EMPLOYEE";
        String username = keycloakUserService.createKeycloakUserWithTempPassword(
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                role,
                tempPassword
        );

        Employee savedEmployee;
        try {
            // Persister l'employé en base
            Employee employee = new Employee();
            // Matricule temporaire unique — sera remplacé par EMP-{id} après le premier save
            employee.setMatricule("TMP-" + java.util.UUID.randomUUID());
            employee.setFirstName(request.getFirstName());
            employee.setLastName(request.getLastName());
            employee.setEmail(request.getEmail());
            employee.setPhone(request.getPhone());
            employee.setPosition(request.getPosition());
            employee.setHireDate(request.getHireDate());
            employee.setKeycloakUsername(username);

            // Résoudre le département depuis la BDD (le frontend envoie {id: X})
            if (request.getDepartment() != null && request.getDepartment().getId() != null) {
                Department dept = departmentRepository.findById(request.getDepartment().getId())
                        .orElse(null);
                employee.setDepartment(dept);
            }

            // Résoudre le service depuis la BDD (le frontend envoie {id: X})
            if (request.getService() != null && request.getService().getId() != null) {
                ServiceEntity svc = serviceRepository.findById(request.getService().getId())
                        .orElse(null);
                employee.setService(svc);
            }

            // Gérer le contrat (cascade ALL depuis Employee, donc on le crée et l'associe).
            // startDate est NOT NULL en base : on prend hireDate à défaut, sinon aujourd'hui.
            if (request.getContract() != null && request.getContract().getType() != null) {
                Contract contract = request.getContract();
                if (contract.getStartDate() == null) {
                    contract.setStartDate(request.getHireDate() != null ? request.getHireDate() : LocalDate.now());
                }
                employee.setContract(contract);
            }

            // Compétences pré-validées (extraction CV par IA)
            if (request.getInitialSkills() != null && !request.getInitialSkills().isEmpty()) {
                for (EmployeeCreateRequest.InitialSkillRequest s : request.getInitialSkills()) {
                    if (s.getSkillId() == null || s.getLevel() == null) continue;
                    int lvl = Math.max(1, Math.min(5, s.getLevel()));
                    EmployeeSkill es = EmployeeSkill.builder()
                            .employee(employee)
                            .skillId(s.getSkillId())
                            .skillName(s.getSkillName())
                            .category(s.getCategory())
                            .level(lvl)
                            .build();
                    employee.getSkills().add(es);
                }
            }

            savedEmployee = employeeRepository.save(employee);
            // Génère le matricule final à partir de l'ID auto-incrémenté
            savedEmployee.setMatricule(String.format("EMP-%03d", savedEmployee.getId()));
            savedEmployee = employeeRepository.save(savedEmployee);
        } catch (RuntimeException e) {
            // Compensation : éviter un utilisateur Keycloak orphelin si la persistance échoue
            log.error("Échec persistance employé {} — suppression de l'utilisateur Keycloak {}", request.getEmail(), username, e);
            try {
                keycloakUserService.deleteKeycloakUser(username);
            } catch (Exception cleanup) {
                log.error("Échec suppression Keycloak de l'utilisateur orphelin {}: {}", username, cleanup.getMessage());
            }
            throw e;
        }

        log.info("Employé créé: {} {} ({})", request.getFirstName(), request.getLastName(), username);

        // Email de bienvenue avec username + mot de passe temporaire + lien de connexion
        try {
            welcomeEmailService.sendWelcomeEmail(
                    request.getEmail(),
                    request.getFirstName(),
                    username,
                    tempPassword
            );
        } catch (Exception e) {
            // L'employé est déjà créé : on n'annule pas, mais on log l'incident
            log.error("Échec envoi email de bienvenue à {} (employé créé sans email envoyé): {}",
                    request.getEmail(), e.getMessage());
        }

        return savedEmployee;
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
        employee.setKeycloakUsername(employeeDetails.getKeycloakUsername());

        // Résoudre le département depuis la BDD
        if (employeeDetails.getDepartment() != null && employeeDetails.getDepartment().getId() != null) {
            Department dept = departmentRepository.findById(employeeDetails.getDepartment().getId())
                    .orElse(null);
            employee.setDepartment(dept);
        } else {
            employee.setDepartment(null);
        }

        // Résoudre le service depuis la BDD
        if (employeeDetails.getService() != null && employeeDetails.getService().getId() != null) {
            ServiceEntity svc = serviceRepository.findById(employeeDetails.getService().getId())
                    .orElse(null);
            employee.setService(svc);
        } else {
            employee.setService(null);
        }

        // Gérer le contrat (startDate NOT NULL : retombée sur hireDate puis aujourd'hui)
        if (employeeDetails.getContract() != null && employeeDetails.getContract().getType() != null) {
            Contract contract = employeeDetails.getContract();
            LocalDate startDate = contract.getStartDate();
            if (startDate == null) {
                startDate = employee.getHireDate() != null ? employee.getHireDate() : LocalDate.now();
            }
            if (employee.getContract() != null) {
                // Mise à jour du contrat existant
                employee.getContract().setType(contract.getType());
                employee.getContract().setStartDate(startDate);
                employee.getContract().setEndDate(contract.getEndDate());
                employee.getContract().setSalary(contract.getSalary());
            } else {
                contract.setStartDate(startDate);
                employee.setContract(contract);
            }
        }

        return employeeRepository.save(employee);
    }

    /** Supprime un employé et son compte Keycloak associé */
    public void deleteEmployee(Long id) {
        employeeRepository.findById(id).ifPresent(emp -> {
            keycloakUserService.deleteKeycloakUser(emp.getKeycloakUsername());
            employeeRepository.delete(emp);
        });
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
