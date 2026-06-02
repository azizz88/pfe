package com.aziz.employeeservice.repositories;

import com.aziz.employeeservice.entities.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'accès aux données des départements.
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /** Recherche un département par son nom */
    Optional<Department> findByName(String name);

    /** Recherche le département managé par un employé donné (relation 1-1 inverse). */
    Optional<Department> findByManagerId(Long managerId);

    /** Liste tous les départements dont l'employé donné est manager (un manager peut gérer plusieurs départements). */
    List<Department> findAllByManagerId(Long managerId);
}
