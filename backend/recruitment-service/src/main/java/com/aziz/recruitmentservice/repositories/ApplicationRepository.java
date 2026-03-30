package com.aziz.recruitmentservice.repositories;

import com.aziz.recruitmentservice.entities.Application;
import com.aziz.recruitmentservice.entities.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour l'accès aux candidatures.
 */
@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    /** Candidatures d'un employé (historique personnel) */
    List<Application> findByEmployeeMatricule(String employeeMatricule);

    /** Candidatures pour une offre d'emploi donnée */
    List<Application> findByJobOfferId(Long jobOfferId);

    /** Candidatures par statut */
    List<Application> findByStatus(ApplicationStatus status);

    /** Nombre de candidatures par statut (pour les rapports) */
    @Query("SELECT a.status, COUNT(a) FROM Application a GROUP BY a.status")
    List<Object[]> countByStatus();

    /** Nombre de candidatures par offre d'emploi */
    @Query("SELECT a.jobOfferTitle, COUNT(a) FROM Application a GROUP BY a.jobOfferTitle")
    List<Object[]> countByJobOffer();
}
