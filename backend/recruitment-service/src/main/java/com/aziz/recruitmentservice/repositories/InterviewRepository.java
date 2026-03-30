package com.aziz.recruitmentservice.repositories;

import com.aziz.recruitmentservice.entities.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour l'accès aux entretiens.
 */
@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    /** Entretiens d'une candidature */
    List<Interview> findByApplicationId(Long applicationId);
}
