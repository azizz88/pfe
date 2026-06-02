package com.aziz.recruitmentservice.repositories;

import com.aziz.recruitmentservice.entities.ExternalCandidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExternalCandidateRepository extends JpaRepository<ExternalCandidate, Long> {

    Optional<ExternalCandidate> findByEmail(String email);

    List<ExternalCandidate> findAllByOrderByCreatedAtDesc();
}
