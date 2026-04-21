package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.entities.Application;
import com.aziz.recruitmentservice.entities.ApplicationStatus;
import com.aziz.recruitmentservice.entities.JobOffer;
import com.aziz.recruitmentservice.repositories.ApplicationRepository;
import com.aziz.recruitmentservice.repositories.JobOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service métier pour la gestion des candidatures.
 * Gère le workflow : EN_ATTENTE → ENTRETIEN → RETENU / REFUSE
 */
@Service
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobOfferRepository jobOfferRepository;

    public ApplicationService(ApplicationRepository applicationRepository, JobOfferRepository jobOfferRepository) {
        this.applicationRepository = applicationRepository;
        this.jobOfferRepository = jobOfferRepository;
    }


    // =============================================
    // Méthodes EMPLOYÉ
    // =============================================

    /**
     * Soumet une candidature à une offre d'emploi active.
     * Initialise le statut à EN_ATTENTE.
     */
    public Application submitApplication(Application application) {
        // Vérifier que l'offre existe et est active
        JobOffer offer = jobOfferRepository.findById(application.getJobOfferId())
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

        // Vérifier que l'employé n'a pas déjà postulé à cette offre
        if (applicationRepository.existsByEmployeeMatriculeAndJobOfferId(
                application.getEmployeeMatricule(), application.getJobOfferId())) {
            throw new RuntimeException("Vous avez déjà postulé à cette offre.");
        }

        application.setJobOffer(offer);
        application.setJobOfferTitle(offer.getTitle());
        application.setStatus(ApplicationStatus.EN_ATTENTE);
        application.setApplicationDate(LocalDate.now());

        return applicationRepository.save(application);
    }

    /**
     * Historique des candidatures d'un employé.
     */
    @Transactional(readOnly = true)
    public List<Application> getMyApplications(String employeeMatricule) {
        return applicationRepository.findByEmployeeMatricule(employeeMatricule);
    }

    // =============================================
    // Méthodes RH ADMIN
    // =============================================

    /** Liste toutes les candidatures */
    @Transactional(readOnly = true)
    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    /** Candidatures pour une offre spécifique */
    @Transactional(readOnly = true)
    public List<Application> getApplicationsByJobOffer(Long jobOfferId) {
        return applicationRepository.findByJobOfferId(jobOfferId);
    }

    /** Récupère une candidature par son ID */
    @Transactional(readOnly = true)
    public Optional<Application> getApplicationById(Long id) {
        return applicationRepository.findById(id);
    }

    /**
     * Change le statut d'une candidature (workflow).
     * Transitions autorisées :
     *   EN_ATTENTE → ENTRETIEN
     *   ENTRETIEN → RETENU ou REFUSE
     *   EN_ATTENTE → REFUSE
     */
    public Application updateStatus(Long id, ApplicationStatus newStatus) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée avec l'ID: " + id));

        application.setStatus(newStatus);
        return applicationRepository.save(application);
    }

    /**
     * Rapport de mobilité interne : statistiques sur les candidatures.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getMobilityReport() {
        Map<String, Object> report = new HashMap<>();

        // Total de candidatures
        report.put("totalApplications", applicationRepository.count());

        // Répartition par statut
        Map<String, Long> byStatus = new HashMap<>();
        for (Object[] row : applicationRepository.countByStatus()) {
            byStatus.put(row[0].toString(), (Long) row[1]);
        }
        report.put("byStatus", byStatus);

        // Répartition par offre
        Map<String, Long> byJobOffer = new HashMap<>();
        for (Object[] row : applicationRepository.countByJobOffer()) {
            byJobOffer.put((String) row[0], (Long) row[1]);
        }
        report.put("byJobOffer", byJobOffer);

        return report;
    }
}
