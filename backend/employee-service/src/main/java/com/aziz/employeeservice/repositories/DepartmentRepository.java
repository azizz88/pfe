package com.aziz.employeeservice.repositories;

import com.aziz.employeeservice.entities.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour l'accès aux données des départements.
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /** Recherche un département par son nom */
    Optional<Department> findByName(String name);
}
