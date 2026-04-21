package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.dto.JobOfferRequest;
import com.aziz.recruitmentservice.entities.JobOffer;
import com.aziz.recruitmentservice.entities.JobOfferStatus;
import com.aziz.recruitmentservice.entities.Skill;
import com.aziz.recruitmentservice.repositories.JobOfferRepository;
import com.aziz.recruitmentservice.repositories.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Service métier pour la gestion des offres d'emploi internes.
 */
@Service
@Transactional
public class JobOfferService {

    private final JobOfferRepository jobOfferRepository;
    private final SkillRepository skillRepository;

    public JobOfferService(JobOfferRepository jobOfferRepository, SkillRepository skillRepository) {
        this.jobOfferRepository = jobOfferRepository;
        this.skillRepository = skillRepository;
    }

    private Set<Skill> resolveSkills(List<Long> skillIds) {
        if (skillIds == null || skillIds.isEmpty()) return new HashSet<>();
        return new HashSet<>(skillRepository.findAllById(skillIds));
    }


    /** Liste toutes les offres actives (pour les employés) */
    @Transactional(readOnly = true)
    public List<JobOffer> getActiveOffers() {
        return jobOfferRepository.findByStatus(JobOfferStatus.ACTIVE);
    }

    /** Liste toutes les offres (pour le RH Admin) */
    @Transactional(readOnly = true)
    public List<JobOffer> getAllOffers() {
        return jobOfferRepository.findAll();
    }

    /** Récupère une offre par son ID */
    @Transactional(readOnly = true)
    public Optional<JobOffer> getOfferById(Long id) {
        return jobOfferRepository.findById(id);
    }

    /** Crée et publie une nouvelle offre d'emploi */
    public JobOffer createOffer(JobOfferRequest req) {
        JobOffer offer = JobOffer.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .department(req.getDepartment())
                .deadline(req.getDeadline())
                .skills(resolveSkills(req.getSkillIds()))
                .status(JobOfferStatus.ACTIVE)
                .publishDate(LocalDate.now())
                .build();
        return jobOfferRepository.save(offer);
    }

    /** Met à jour une offre existante */
    public JobOffer updateOffer(Long id, JobOfferRequest req) {
        JobOffer offer = jobOfferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée avec l'ID: " + id));

        offer.setTitle(req.getTitle());
        offer.setDescription(req.getDescription());
        offer.setDepartment(req.getDepartment());
        offer.setDeadline(req.getDeadline());
        offer.setSkills(resolveSkills(req.getSkillIds()));
        return jobOfferRepository.save(offer);
    }

    /** Clôture une offre d'emploi */
    public JobOffer closeOffer(Long id) {
        JobOffer offer = jobOfferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée avec l'ID: " + id));
        offer.setStatus(JobOfferStatus.CLOSED);
        return jobOfferRepository.save(offer);
    }

    /** Supprime une offre */
    public void deleteOffer(Long id) {
        jobOfferRepository.deleteById(id);
    }
}
