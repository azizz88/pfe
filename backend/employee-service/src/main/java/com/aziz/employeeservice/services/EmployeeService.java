package com.aziz.employeeservice.services;

import com.aziz.employeeservice.dto.EmployeeCreateRequest;
import com.aziz.employeeservice.entities.Contract;
import com.aziz.employeeservice.entities.Department;
import com.aziz.employeeservice.entities.Employee;
import com.aziz.employeeservice.entities.EmployeeSkill;
import com.aziz.employeeservice.entities.ContractType;
import com.aziz.employeeservice.entities.PositionHistory;
import com.aziz.employeeservice.entities.PositionHistoryReason;
import com.aziz.employeeservice.entities.ServiceEntity;
import com.aziz.employeeservice.repositories.ContractRepository;
import com.aziz.employeeservice.repositories.DepartmentRepository;
import com.aziz.employeeservice.repositories.EmployeeRepository;
import com.aziz.employeeservice.repositories.PositionHistoryRepository;
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
    private final PositionHistoryRepository positionHistoryRepository;

    public EmployeeService(EmployeeRepository employeeRepository,
                           DepartmentRepository departmentRepository,
                           ContractRepository contractRepository,
                           ServiceRepository serviceRepository,
                           KeycloakUserService keycloakUserService,
                           WelcomeEmailService welcomeEmailService,
                           PositionHistoryRepository positionHistoryRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.contractRepository = contractRepository;
        this.serviceRepository = serviceRepository;
        this.keycloakUserService = keycloakUserService;
        this.welcomeEmailService = welcomeEmailService;
        this.positionHistoryRepository = positionHistoryRepository;
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
        String role = request.getKeycloakRole() != null ? request.getKeycloakRole() : "EMPLOYEE";

        // Validation préalable pour le rôle MANAGER : éviter de créer un compte Keycloak orphelin
        // si le département managé est invalide ou déjà attribué à un autre manager.
        Department managedDepartment = null;
        if ("MANAGER".equals(role)) {
            if (request.getManagedDepartmentId() == null) {
                throw new RuntimeException("Un département managé est requis pour le rôle Manager.");
            }
            managedDepartment = departmentRepository.findById(request.getManagedDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Département introuvable : " + request.getManagedDepartmentId()));
            if (managedDepartment.getManager() != null) {
                Employee current = managedDepartment.getManager();
                throw new RuntimeException("Le département '" + managedDepartment.getName()
                        + "' a déjà un manager : " + current.getFirstName() + " " + current.getLastName());
            }
        }

        // Génère un mot de passe temporaire et crée le user Keycloak (qui forcera le changement à la 1ère connexion)
        String tempPassword = keycloakUserService.generateTempPassword();
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

            // Ligne d'historique initiale : HIRE — fondation du parcours de l'employé.
            if (savedEmployee.getPosition() != null && !savedEmployee.getPosition().isBlank()) {
                PositionHistory hire = PositionHistory.builder()
                        .employee(savedEmployee)
                        .position(savedEmployee.getPosition())
                        .departmentName(savedEmployee.getDepartment() != null
                                ? savedEmployee.getDepartment().getName() : null)
                        .serviceName(savedEmployee.getService() != null
                                ? savedEmployee.getService().getName() : null)
                        .startDate(savedEmployee.getHireDate() != null
                                ? savedEmployee.getHireDate() : LocalDate.now())
                        .endDate(null)
                        .reason(PositionHistoryReason.HIRE)
                        .notes("Embauche initiale")
                        .build();
                positionHistoryRepository.save(hire);
            }

            // Si rôle MANAGER : assigner ce nouvel employé comme manager du département choisi
            if (managedDepartment != null) {
                managedDepartment.setManager(savedEmployee);
                departmentRepository.save(managedDepartment);
                log.info("Manager assigné : {} {} -> département '{}'",
                        savedEmployee.getFirstName(), savedEmployee.getLastName(), managedDepartment.getName());
            }
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
    /**
     * Met à jour le poste d'un employé (recherche par matricule, ou keycloakUsername en fallback)
     * <b>et enregistre l'historique de carrière</b> :
     * <ol>
     *   <li>ferme la ligne actuelle (endDate = aujourd'hui)</li>
     *   <li>crée une nouvelle ligne PositionHistory pour le nouveau poste</li>
     *   <li>met à jour le champ dénormalisé {@code Employee.position}</li>
     * </ol>
     *
     * Si {@code newPosition} est identique au poste actuel, aucun changement n'est effectué.
     * Tous les paramètres de contexte sont optionnels et sont copiés dans l'historique pour audit.
     */
    public Employee updatePosition(String matricule, String newPosition, PositionHistoryReason reason,
                                   Long sourceApplicationId, String validatedByManagerName, String notes) {
        Employee employee = employeeRepository.findByMatricule(matricule)
                .or(() -> employeeRepository.findByKeycloakUsername(matricule))
                .orElseThrow(() -> new RuntimeException("Employé non trouvé : " + matricule));

        // No-op si le poste ne change pas réellement
        if (newPosition != null && newPosition.equals(employee.getPosition())) {
            return employee;
        }

        LocalDate today = LocalDate.now();

        // 1) Fermer la ligne courante (s'il y en a une)
        positionHistoryRepository.findCurrentByEmployeeId(employee.getId()).ifPresent(current -> {
            current.setEndDate(today);
            positionHistoryRepository.save(current);
        });

        // 2) Nouvelle ligne "poste actuel"
        PositionHistory entry = PositionHistory.builder()
                .employee(employee)
                .position(newPosition)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .serviceName(employee.getService() != null ? employee.getService().getName() : null)
                .startDate(today)
                .endDate(null)
                .reason(reason != null ? reason : PositionHistoryReason.REASSIGNMENT)
                .sourceApplicationId(sourceApplicationId)
                .validatedByManagerName(validatedByManagerName)
                .notes(notes)
                .build();
        positionHistoryRepository.save(entry);

        // 3) Dénormalisation
        employee.setPosition(newPosition);
        log.info("Poste de {} mis à jour → « {} » (raison: {})", matricule, newPosition, entry.getReason());
        return employeeRepository.save(employee);
    }

    /** Surcharge legacy gardée pour compatibilité interne (équivaut à REASSIGNMENT). */
    public Employee updatePosition(String matricule, String position) {
        return updatePosition(matricule, position, PositionHistoryReason.REASSIGNMENT, null, null, null);
    }

    /** Historique de carrière d'un employé (le plus récent en premier). */
    @Transactional(readOnly = true)
    public List<PositionHistory> getPositionHistory(String matriculeOrUsername) {
        Employee employee = employeeRepository.findByMatricule(matriculeOrUsername)
                .or(() -> employeeRepository.findByKeycloakUsername(matriculeOrUsername))
                .orElseThrow(() -> new RuntimeException("Employé non trouvé : " + matriculeOrUsername));
        return positionHistoryRepository.findByEmployeeIdOrdered(employee.getId());
    }

    /**
     * Récupère le contexte "Mon équipe" du manager connecté :
     * <ul>
     *   <li>la liste des départements qu'il gère (un manager peut en gérer plusieurs)</li>
     *   <li>la liste des employés rattachés à ces départements (hors lui-même)</li>
     * </ul>
     * Retourne des structures simples (Map) pour découpler la sérialisation des entités JPA lazy.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getManagerTeamContext(String managerKeycloakUsername) {
        Employee manager = employeeRepository.findByKeycloakUsername(managerKeycloakUsername).orElse(null);
        Map<String, Object> result = new HashMap<>();
        if (manager == null) {
            result.put("departments", List.of());
            result.put("team", List.of());
            result.put("teamSize", 0);
            return result;
        }

        List<Department> managed = departmentRepository.findAllByManagerId(manager.getId());

        List<Map<String, Object>> departmentsOut = new ArrayList<>();
        List<Map<String, Object>> teamOut = new ArrayList<>();
        Set<Long> seenEmployeeIds = new HashSet<>();

        for (Department dept : managed) {
            Map<String, Object> d = new HashMap<>();
            d.put("id", dept.getId());
            d.put("name", dept.getName());
            d.put("description", dept.getDescription());
            List<Employee> members = employeeRepository.findByDepartmentId(dept.getId());
            d.put("employeeCount", members.size());
            departmentsOut.add(d);

            for (Employee e : members) {
                if (e.getId().equals(manager.getId())) continue;        // skip self
                if (!seenEmployeeIds.add(e.getId())) continue;          // dedup si présent dans 2 départements
                Map<String, Object> m = new HashMap<>();
                m.put("id", e.getId());
                m.put("matricule", e.getMatricule());
                m.put("firstName", e.getFirstName());
                m.put("lastName", e.getLastName());
                m.put("email", e.getEmail());
                m.put("position", e.getPosition());
                m.put("hireDate", e.getHireDate());
                m.put("departmentName", dept.getName());
                m.put("serviceName", e.getService() != null ? e.getService().getName() : null);
                // Détecte une promotion récente (<30 jours) pour le badge "🚀 Promu récemment".
                positionHistoryRepository.findCurrentByEmployeeId(e.getId()).ifPresent(cur -> {
                    if (cur.getReason() == PositionHistoryReason.PROMOTION
                            && cur.getStartDate() != null
                            && ChronoUnit.DAYS.between(cur.getStartDate(), LocalDate.now()) < 30) {
                        m.put("recentPromotion", true);
                        m.put("promotionDate", cur.getStartDate());
                    }
                });
                teamOut.add(m);
            }
        }

        // Tri équipe par nom pour un rendu stable
        teamOut.sort(Comparator.comparing(
                (Map<String, Object> m) -> ((String) m.getOrDefault("lastName", "")).toLowerCase()));

        result.put("manager", Map.of(
                "id", manager.getId(),
                "matricule", manager.getMatricule() != null ? manager.getMatricule() : "",
                "fullName", (manager.getFirstName() + " " + manager.getLastName()).trim()));
        result.put("departments", departmentsOut);
        result.put("team", teamOut);
        result.put("teamSize", teamOut.size());
        return result;
    }

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
            // Si l'employé est manager d'un département, libérer ce département (sinon contrainte FK)
            departmentRepository.findByManagerId(emp.getId()).ifPresent(dept -> {
                log.info("Libération du département '{}' avant suppression du manager {} {}",
                        dept.getName(), emp.getFirstName(), emp.getLastName());
                dept.setManager(null);
                departmentRepository.save(dept);
            });
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
            // Manager responsable (peut être null)
            if (dept.getManager() != null) {
                Employee mgr = dept.getManager();
                Map<String, Object> mgrInfo = new HashMap<>();
                mgrInfo.put("id", mgr.getId());
                mgrInfo.put("matricule", mgr.getMatricule());
                mgrInfo.put("firstName", mgr.getFirstName());
                mgrInfo.put("lastName", mgr.getLastName());
                mgrInfo.put("email", mgr.getEmail());
                mgrInfo.put("position", mgr.getPosition());
                deptInfo.put("manager", mgrInfo);
            } else {
                deptInfo.put("manager", null);
            }
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
