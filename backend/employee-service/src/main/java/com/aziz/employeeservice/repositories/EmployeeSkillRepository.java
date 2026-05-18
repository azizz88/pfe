package com.aziz.employeeservice.repositories;

import com.aziz.employeeservice.entities.EmployeeSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeSkillRepository extends JpaRepository<EmployeeSkill, Long> {

    List<EmployeeSkill> findByEmployee_Matricule(String matricule);

    Optional<EmployeeSkill> findByEmployee_MatriculeAndSkillId(String matricule, Long skillId);

    void deleteByEmployee_MatriculeAndSkillId(String matricule, Long skillId);
}
