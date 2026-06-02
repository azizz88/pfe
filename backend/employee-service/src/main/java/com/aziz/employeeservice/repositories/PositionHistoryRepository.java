package com.aziz.employeeservice.repositories;

import com.aziz.employeeservice.entities.PositionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PositionHistoryRepository extends JpaRepository<PositionHistory, Long> {

    /** Historique complet d'un employé, le plus récent en premier (ligne courante en tête). */
    @Query("SELECT p FROM PositionHistory p WHERE p.employee.id = :employeeId " +
           "ORDER BY (CASE WHEN p.endDate IS NULL THEN 0 ELSE 1 END), p.startDate DESC, p.id DESC")
    List<PositionHistory> findByEmployeeIdOrdered(@Param("employeeId") Long employeeId);

    /** Ligne courante (endDate IS NULL) — il ne doit y en avoir qu'une à la fois. */
    @Query("SELECT p FROM PositionHistory p WHERE p.employee.id = :employeeId AND p.endDate IS NULL")
    Optional<PositionHistory> findCurrentByEmployeeId(@Param("employeeId") Long employeeId);
}
