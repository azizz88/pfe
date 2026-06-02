package com.aziz.recruitmentservice.repositories;

import com.aziz.recruitmentservice.entities.Interview;
import com.aziz.recruitmentservice.entities.InterviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour l'accès aux entretiens.
 */
@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    /** Entretiens d'une candidature */
    List<Interview> findByApplicationId(Long applicationId);

    /**
     * Entretiens assignés à un manager (par username Keycloak), tri stable :
     * PENDING_SCHEDULING d'abord (à traiter), puis dates récentes en premier.
     * Les entretiens en PENDING_SCHEDULING n'ont pas de scheduledDate, donc on trie sur assignedAt.
     */
    @Query("SELECT i FROM Interview i WHERE i.managerUsername = :managerUsername " +
            "ORDER BY " +
            " CASE WHEN i.status = com.aziz.recruitmentservice.entities.InterviewStatus.PENDING_SCHEDULING THEN 0 ELSE 1 END, " +
            " COALESCE(i.scheduledDate, i.assignedAt) DESC")
    List<Interview> findByManagerSorted(@Param("managerUsername") String managerUsername);

    /** Entretiens à planifier pour un manager (status PENDING_SCHEDULING). */
    List<Interview> findByManagerUsernameAndStatusOrderByAssignedAtAsc(String managerUsername, InterviewStatus status);

    /**
     * Tous les entretiens triés : PENDING_SCHEDULING en tête (pour la vue RH globale),
     * puis le reste par date décroissante.
     */
    @Query("SELECT i FROM Interview i ORDER BY " +
            " CASE WHEN i.status = com.aziz.recruitmentservice.entities.InterviewStatus.PENDING_SCHEDULING THEN 0 ELSE 1 END, " +
            " COALESCE(i.scheduledDate, i.assignedAt) DESC")
    List<Interview> findAllSorted();
}
