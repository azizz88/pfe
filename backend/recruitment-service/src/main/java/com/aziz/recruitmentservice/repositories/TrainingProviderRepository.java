package com.aziz.recruitmentservice.repositories;

import com.aziz.recruitmentservice.entities.ConventionStatus;
import com.aziz.recruitmentservice.entities.DeliveryMode;
import com.aziz.recruitmentservice.entities.TrainingProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingProviderRepository extends JpaRepository<TrainingProvider, Long> {

    Optional<TrainingProvider> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<TrainingProvider> findByConventionStatus(ConventionStatus status);

    List<TrainingProvider> findByDeliveryMode(DeliveryMode mode);

    @Query("SELECT DISTINCT p FROM TrainingProvider p JOIN p.skillsCovered s WHERE s.id IN :skillIds")
    List<TrainingProvider> findBySkillIds(@Param("skillIds") List<Long> skillIds);
}
