package com.aziz.employeeservice.repositories;

import com.aziz.employeeservice.entities.Employee;
import com.aziz.employeeservice.entities.ContractType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'accès aux données des employés.
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    /** Recherche un employé par son matricule unique */
    Optional<Employee> findByMatricule(String matricule);

    /** Recherche un employé par son nom d'utilisateur Keycloak */
    Optional<Employee> findByKeycloakUsername(String keycloakUsername);

    /** Liste les employés d'un département donné */
    List<Employee> findByDepartmentId(Long departmentId);

    /** Liste les employés par type de contrat */
    @Query("SELECT e FROM Employee e WHERE e.contract.type = :contractType")
    List<Employee> findByContractType(@Param("contractType") ContractType contractType);

    /** Recherche par nom ou prénom (pour l'annuaire) */
    @Query("SELECT e FROM Employee e WHERE LOWER(e.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Employee> searchByName(@Param("keyword") String keyword);

    /** Compte le nombre d'employés par département */
    @Query("SELECT e.department.name, COUNT(e) FROM Employee e GROUP BY e.department.name")
    List<Object[]> countByDepartment();

    /** Compte le nombre d'employés par type de contrat */
    @Query("SELECT e.contract.type, COUNT(e) FROM Employee e GROUP BY e.contract.type")
    List<Object[]> countByContractType();

    /** Masse salariale totale */
    @Query("SELECT COALESCE(SUM(e.contract.salary), 0) FROM Employee e WHERE e.contract IS NOT NULL")
    Double getTotalSalaryMass();

    /** Masse salariale par département */
    @Query("SELECT e.department.name, SUM(e.contract.salary) FROM Employee e WHERE e.contract IS NOT NULL AND e.department IS NOT NULL GROUP BY e.department.name")
    List<Object[]> getSalaryByDepartment();
}
