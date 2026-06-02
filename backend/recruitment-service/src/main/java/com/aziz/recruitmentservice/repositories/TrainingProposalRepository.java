package com.aziz.recruitmentservice.repositories;

import com.aziz.recruitmentservice.entities.TrainingProposal;
import com.aziz.recruitmentservice.entities.TrainingProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingProposalRepository extends JpaRepository<TrainingProposal, Long> {

    /** Pipeline manager : toutes ses propositions, plus récentes en premier. */
    List<TrainingProposal> findByManagerUsernameOrderByCreatedAtDesc(String managerUsername);

    /** Vue employé : ses propositions, plus récentes en premier. */
    List<TrainingProposal> findByEmployeeMatriculeOrderByCreatedAtDesc(String employeeMatricule);

    /** Toutes les propositions (vue HR Admin globale), plus récentes en premier. */
    List<TrainingProposal> findAllByOrderByCreatedAtDesc();

    /** Compteur par statut pour les KPIs dashboard. */
    long countByManagerUsernameAndStatus(String managerUsername, TrainingProposalStatus status);
}
