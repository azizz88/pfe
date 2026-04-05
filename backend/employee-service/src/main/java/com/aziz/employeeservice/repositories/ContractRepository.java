package com.aziz.employeeservice.repositories;

import com.aziz.employeeservice.entities.Contract;
import com.aziz.employeeservice.entities.ContractType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'accès aux données des contrats.
 */
@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    /** Liste les contrats par type */
    List<Contract> findByType(ContractType type);

    /** Recherche le contrat d'un employé */
    Optional<Contract> findByEmployeeId(Long employeeId);

    /** Contrats expirant avant une date limite */
    @Query("SELECT c FROM Contract c WHERE c.endDate IS NOT NULL AND c.endDate > CURRENT_DATE AND c.endDate <= :limitDate")
    List<Contract> findExpiringBefore(@Param("limitDate") LocalDate limitDate);
}
