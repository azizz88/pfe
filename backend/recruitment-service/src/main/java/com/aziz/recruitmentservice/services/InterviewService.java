package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.entities.Application;
import com.aziz.recruitmentservice.entities.Interview;
import com.aziz.recruitmentservice.repositories.ApplicationRepository;
import com.aziz.recruitmentservice.repositories.InterviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service métier pour la gestion des entretiens.
 * Réservé aux RH Admin.
 */
@Service
@Transactional
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;

    public InterviewService(InterviewRepository interviewRepository, ApplicationRepository applicationRepository) {
        this.interviewRepository = interviewRepository;
        this.applicationRepository = applicationRepository;
    }


    /** Planifie un entretien pour une candidature */
    public Interview scheduleInterview(Interview interview) {
        Application application = applicationRepository.findById(interview.getApplicationId())
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));

        interview.setApplication(application);
        return interviewRepository.save(interview);
    }

    /** Liste les entretiens d'une candidature */
    @Transactional(readOnly = true)
    public List<Interview> getInterviewsByApplication(Long applicationId) {
        return interviewRepository.findByApplicationId(applicationId);
    }

    /** Met à jour un entretien (notes, résultat) */
    public Interview updateInterview(Long id, Interview interviewDetails) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien non trouvé avec l'ID: " + id));

        interview.setScheduledDate(interviewDetails.getScheduledDate());
        interview.setInterviewer(interviewDetails.getInterviewer());
        interview.setNotes(interviewDetails.getNotes());
        interview.setResult(interviewDetails.getResult());
        return interviewRepository.save(interview);
    }

    /** Récupère un entretien par son ID */
    @Transactional(readOnly = true)
    public Optional<Interview> getInterviewById(Long id) {
        return interviewRepository.findById(id);
    }
}
