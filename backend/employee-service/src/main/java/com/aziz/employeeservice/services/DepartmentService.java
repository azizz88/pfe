package com.aziz.employeeservice.services;

import com.aziz.employeeservice.entities.Department;
import com.aziz.employeeservice.repositories.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service métier pour la gestion des départements.
 * Réservé aux RH Admin.
 */
@Service
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }


    /** Liste tous les départements */
    @Transactional(readOnly = true)
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    /** Récupère un département par son ID */
    @Transactional(readOnly = true)
    public Optional<Department> getDepartmentById(Long id) {
        return departmentRepository.findById(id);
    }

    /** Crée un nouveau département */
    public Department createDepartment(Department department) {
        return departmentRepository.save(department);
    }

    /** Met à jour un département existant */
    public Department updateDepartment(Long id, Department departmentDetails) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Département non trouvé avec l'ID: " + id));

        department.setName(departmentDetails.getName());
        department.setDescription(departmentDetails.getDescription());
        return departmentRepository.save(department);
    }

    /** Supprime un département */
    public void deleteDepartment(Long id) {
        departmentRepository.deleteById(id);
    }
}
