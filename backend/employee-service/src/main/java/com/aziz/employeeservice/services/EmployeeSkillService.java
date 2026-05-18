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
    public List<EmployeeSkill> getSkillsByMatricule(String matricule) {
        return skillRepository.findByEmployee_Matricule(matricule);
    }

    public EmployeeSkill addOrUpdateSkill(String matricule, EmployeeSkillRequest req) {
        Employee employee = employeeRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé : " + matricule));

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

    public EmployeeSkill updateLevel(String matricule, Long skillId, Integer level) {
        validateLevel(level);
        EmployeeSkill skill = skillRepository.findByEmployee_MatriculeAndSkillId(matricule, skillId)
                .orElseThrow(() -> new RuntimeException("Compétence non trouvée pour " + matricule));
        skill.setLevel(level);
        return skillRepository.save(skill);
    }

    public void removeSkill(String matricule, Long skillId) {
        skillRepository.deleteByEmployee_MatriculeAndSkillId(matricule, skillId);
    }

    private void validateLevel(Integer level) {
        if (level == null || level < 1 || level > 5) {
            throw new IllegalArgumentException("Le niveau doit être compris entre 1 et 5");
        }
    }
}
