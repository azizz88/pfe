package com.aziz.recruitmentservice.repositories;

import com.aziz.recruitmentservice.entities.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {

    Optional<Skill> findByNameIgnoreCase(String name);

    List<Skill> findByCategoryIgnoreCase(String category);

    boolean existsByNameIgnoreCase(String name);

    // Suppression des liens job_offer_skills avant de supprimer la competence,
    // sinon la contrainte de cle etrangere empeche la suppression.
    @Modifying
    @Query(value = "DELETE FROM job_offer_skills WHERE skill_id = :skillId", nativeQuery = true)
    void unlinkFromAllJobOffers(@Param("skillId") Long skillId);
}
