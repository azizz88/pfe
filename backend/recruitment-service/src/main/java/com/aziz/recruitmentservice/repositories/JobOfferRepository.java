package com.aziz.recruitmentservice.repositories;

import com.aziz.recruitmentservice.entities.JobOffer;
import com.aziz.recruitmentservice.entities.JobOfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour l'accès aux offres d'emploi.
 */
@Repository
public interface JobOfferRepository extends JpaRepository<JobOffer, Long> {

    /** Liste les offres par statut (ACTIVE / CLOSED) */
    List<JobOffer> findByStatus(JobOfferStatus status);

    /** Liste les offres d'un département */
    List<JobOffer> findByDepartment(String department);
}
