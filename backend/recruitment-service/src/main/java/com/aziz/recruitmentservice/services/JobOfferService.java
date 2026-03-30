package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.entities.JobOffer;
import com.aziz.recruitmentservice.entities.JobOfferStatus;
import com.aziz.recruitmentservice.repositories.JobOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Service métier pour la gestion des offres d'emploi internes.
 */
@Service
@Transactional
public class JobOfferService {

    private final JobOfferRepository jobOfferRepository;

    public JobOfferService(JobOfferRepository jobOfferRepository) {
        this.jobOfferRepository = jobOfferRepository;
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
    public JobOffer createOffer(JobOffer jobOffer) {
        jobOffer.setStatus(JobOfferStatus.ACTIVE);
        jobOffer.setPublishDate(LocalDate.now());
        return jobOfferRepository.save(jobOffer);
    }

    /** Met à jour une offre existante */
    public JobOffer updateOffer(Long id, JobOffer offerDetails) {
        JobOffer offer = jobOfferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée avec l'ID: " + id));

        offer.setTitle(offerDetails.getTitle());
        offer.setDescription(offerDetails.getDescription());
        offer.setDepartment(offerDetails.getDepartment());
        offer.setRequiredSkills(offerDetails.getRequiredSkills());
        offer.setDeadline(offerDetails.getDeadline());
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
