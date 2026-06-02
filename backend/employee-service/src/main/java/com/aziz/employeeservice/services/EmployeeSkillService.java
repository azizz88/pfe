package com.aziz.employeeservice.services;

import com.aziz.employeeservice.dto.EmployeeSkillRequest;
import com.aziz.employeeservice.entities.Employee;
import com.aziz.employeeservice.entities.EmployeeSkill;
import com.aziz.employeeservice.repositories.EmployeeRepository;
import com.aziz.employeeservice.repositories.EmployeeSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service métier pour la gestion des compétences des employés.
 */
@Service
@Transactional
public class EmployeeSkillService {

    private final EmployeeSkillRepository skillRepository;
    private final EmployeeRepository employeeRepository;

    public EmployeeSkillService(EmployeeSkillRepository skillRepository,
                                EmployeeRepository employeeRepository) {
        this.skillRepository = skillRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<EmployeeSkill> getSkillsByMatricule(String key) {
        Employee emp = resolveEmployee(key);
        return emp != null ? skillRepository.findByEmployee_Matricule(emp.getMatricule()) : List.of();
    }

    public EmployeeSkill addOrUpdateSkill(String key, EmployeeSkillRequest req) {
        Employee employee = resolveEmployeeOrThrow(key);
        String matricule = employee.getMatricule();

        validateLevel(req.getLevel());

        return skillRepository.findByEmployee_MatriculeAndSkillId(matricule, req.getSkillId())
                .map(existing -> {
                    existing.setLevel(req.getLevel());
                    existing.setSkillName(req.getSkillName());
                    existing.setCategory(req.getCategory());
                    return skillRepository.save(existing);
                })
                .orElseGet(() -> {
                    EmployeeSkill newSkill = EmployeeSkill.builder()
                            .employee(employee)
                            .skillId(req.getSkillId())
                            .skillName(req.getSkillName())
                            .category(req.getCategory())
                            .level(req.getLevel())
                            .build();
                    return skillRepository.save(newSkill);
                });
    }

    public EmployeeSkill updateLevel(String key, Long skillId, Integer level) {
        validateLevel(level);
        Employee employee = resolveEmployeeOrThrow(key);
        String matricule = employee.getMatricule();
        EmployeeSkill skill = skillRepository.findByEmployee_MatriculeAndSkillId(matricule, skillId)
                .orElseThrow(() -> new RuntimeException("Compétence non trouvée pour " + matricule));
        skill.setLevel(level);
        return skillRepository.save(skill);
    }

    public void removeSkill(String key, Long skillId) {
        Employee employee = resolveEmployeeOrThrow(key);
        skillRepository.deleteByEmployee_MatriculeAndSkillId(employee.getMatricule(), skillId);
    }

    /**
     * Résout un employé à partir d'une clé qui peut être soit son matricule, soit son
     * keycloakUsername. Le pipeline candidature/matching stocke parfois l'un, parfois
     * l'autre — accepter les deux évite les "Employé non trouvé" frustrants côté UI.
     */
    private Employee resolveEmployee(String key) {
        if (key == null || key.isBlank()) return null;
        return employeeRepository.findByMatricule(key)
                .or(() -> employeeRepository.findByKeycloakUsername(key))
                .orElse(null);
    }

    private Employee resolveEmployeeOrThrow(String key) {
        Employee emp = resolveEmployee(key);
        if (emp == null) throw new RuntimeException("Employé non trouvé : " + key);
        return emp;
    }

    private void validateLevel(Integer level) {
        if (level == null || level < 1 || level > 5) {
            throw new IllegalArgumentException("Le niveau doit être compris entre 1 et 5");
        }
    }
}
