package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.client.EmployeeClient;
import com.aziz.recruitmentservice.dto.CandidateProfile;
import com.aziz.recruitmentservice.dto.TrainingProgramView;
import com.aziz.recruitmentservice.entities.Application;
import com.aziz.recruitmentservice.entities.ApplicationStatus;
import com.aziz.recruitmentservice.entities.CandidateType;
import com.aziz.recruitmentservice.entities.ExternalCandidate;
import com.aziz.recruitmentservice.entities.Interview;
import com.aziz.recruitmentservice.entities.InterviewStatus;
import com.aziz.recruitmentservice.entities.JobOffer;
import com.aziz.recruitmentservice.entities.Skill;
import com.aziz.recruitmentservice.repositories.ApplicationRepository;
import com.aziz.recruitmentservice.repositories.ExternalCandidateRepository;
import com.aziz.recruitmentservice.repositories.InterviewRepository;
import com.aziz.recruitmentservice.repositories.JobOfferRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service métier pour la gestion des entretiens — workflow en 2 phases.
 *
 * <h3>Phase 1 — Affectation par le RH</h3>
 * Le RH affecte un manager à un candidat via {@link #assignInterview}.
 * Status = PENDING_SCHEDULING, aucune date n'est encore fixée.
 * Le manager reçoit un email l'invitant à planifier ; le candidat reçoit un email "pre-shortlist" rassurant.
 *
 * <h3>Phase 2 — Planification par le manager</h3>
 * Le manager fixe date/heure/lieu via {@link #scheduleByManager}.
 * Status = SCHEDULED, l'email de convocation officiel + .ics part vers le candidat.
 *
 * <h3>Refus possible</h3>
 * Si le manager ne peut/veut pas conduire l'entretien, il appelle {@link #rejectAssignment}
 * avec un motif. Status = REJECTED_BY_MANAGER ; le RH est notifié et doit réaffecter.
 */
@Service
@Transactional
public class InterviewService {

    private static final Logger log = LoggerFactory.getLogger(InterviewService.class);

    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;
    private final ExternalCandidateRepository externalCandidateRepository;
    private final InterviewEmailService emailService;
    private final EmployeeClient employeeClient;
    private final JobOfferRepository jobOfferRepository;

    public InterviewService(InterviewRepository interviewRepository,
                            ApplicationRepository applicationRepository,
                            ExternalCandidateRepository externalCandidateRepository,
                            InterviewEmailService emailService,
                            EmployeeClient employeeClient,
                            JobOfferRepository jobOfferRepository) {
        this.interviewRepository = interviewRepository;
        this.applicationRepository = applicationRepository;
        this.externalCandidateRepository = externalCandidateRepository;
        this.emailService = emailService;
        this.employeeClient = employeeClient;
        this.jobOfferRepository = jobOfferRepository;
    }

    // ──────────────────────────────────────────────────────────
    //  Phase 1 — Affectation par le RH
    // ──────────────────────────────────────────────────────────

    /**
     * Affecte un manager à un entretien (création initiale par le RH, phase 1).
     * Le payload doit contenir : (applicationId OU externalCandidateId), managerUsername, managerName.
     * Champs optionnels : rhNote, candidateEmail (sinon résolu via employee-service).
     */
    public Interview assignInterview(Interview interview, String bearerToken) {
        if (interview.getManagerUsername() == null || interview.getManagerUsername().isBlank()) {
            throw new RuntimeException("Manager assigné requis (managerUsername).");
        }

        interview.setStatus(InterviewStatus.PENDING_SCHEDULING);
        interview.setAssignedAt(LocalDateTime.now());
        interview.setScheduledDate(null);  // sera fixée par le manager
        interview.setScheduledAt(null);
        // Par défaut, l'intervieweur est le manager affecté.
        // Le manager pourra le surcharger à la planification (phase 2).
        // (Évite aussi un NOT NULL legacy sur la colonne `interviewer`.)
        if (interview.getInterviewer() == null || interview.getInterviewer().isBlank()) {
            interview.setInterviewer(interview.getManagerName() != null
                    ? interview.getManagerName()
                    : interview.getManagerUsername());
        }

        // Résolution de l'email du manager (pour la notification phase 1)
        if ((interview.getManagerEmail() == null || interview.getManagerEmail().isBlank())
                && bearerToken != null) {
            Map<String, String> mgrContact = employeeClient.getEmployeeContact(interview.getManagerUsername(), bearerToken);
            if (mgrContact != null && mgrContact.get("email") != null) {
                interview.setManagerEmail(mgrContact.get("email"));
                if (interview.getManagerName() == null) {
                    String fn = mgrContact.get("firstName");
                    String ln = mgrContact.get("lastName");
                    interview.setManagerName(((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim());
                }
            } else {
                log.warn("Email du manager {} non résolu — l'email d'affectation ne sera pas envoyé.",
                        interview.getManagerUsername());
            }
        }

        String candidateEmail = interview.getCandidateEmail();
        String candidateName = interview.getCandidateName();
        String jobOfferTitle = interview.getJobOfferTitle();

        // Résolution interne/externe (identique à l'ancien flow)
        if (interview.getApplicationId() != null) {
            Application application = applicationRepository.findById(interview.getApplicationId())
                    .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));
            interview.setApplication(application);
            if (interview.getCandidateType() == null) interview.setCandidateType(CandidateType.INTERNAL);
            if (candidateName == null) candidateName = application.getApplicantName();
            if (jobOfferTitle == null) jobOfferTitle = application.getJobOfferTitle();
            if (interview.getJobOfferId() == null) interview.setJobOfferId(application.getJobOfferId());
            // Dénormalisation du matching pour que le manager voie directement la catégorie ("À Former").
            if (interview.getMatchingCategory() == null) interview.setMatchingCategory(application.getMatchingCategory());
            if (interview.getMatchingScore() == null) interview.setMatchingScore(application.getMatchingScore());

            if ((candidateEmail == null || candidateEmail.isBlank())
                    && application.getEmployeeMatricule() != null
                    && bearerToken != null) {
                Map<String, String> contact = employeeClient.getEmployeeContact(application.getEmployeeMatricule(), bearerToken);
                if (contact != null && contact.get("email") != null) {
                    candidateEmail = contact.get("email");
                    String fn = contact.get("firstName");
                    String ln = contact.get("lastName");
                    if (fn != null || ln != null) {
                        candidateName = ((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim();
                    }
                } else {
                    log.warn("Email candidat interne matricule={} non résolu — pre-shortlist non envoyé.",
                            application.getEmployeeMatricule());
                }
            }
        } else if (interview.getExternalCandidateId() != null) {
            ExternalCandidate ext = externalCandidateRepository.findById(interview.getExternalCandidateId())
                    .orElseThrow(() -> new RuntimeException("Candidat externe non trouvé : " + interview.getExternalCandidateId()));
            if (interview.getCandidateType() == null) interview.setCandidateType(CandidateType.EXTERNAL);
            if (candidateEmail == null || candidateEmail.isBlank()) candidateEmail = ext.getEmail();
            if (candidateName == null) {
                candidateName = ((ext.getFirstName() != null ? ext.getFirstName() : "")
                        + " " + (ext.getLastName() != null ? ext.getLastName() : "")).trim();
            }
        } else {
            throw new RuntimeException("L'entretien doit référencer applicationId (interne) OU externalCandidateId (externe).");
        }

        interview.setCandidateEmail(candidateEmail);
        interview.setCandidateName(candidateName);
        interview.setJobOfferTitle(jobOfferTitle);

        Interview saved = interviewRepository.save(interview);

        // Notifications (non bloquantes)
        emailService.sendAssignmentToManager(saved);
        emailService.sendPreShortlistToCandidate(saved, candidateEmail, candidateName, jobOfferTitle);

        log.info("Entretien #{} affecté au manager {} (candidat {})",
                saved.getId(), saved.getManagerUsername(), candidateName);
        return saved;
    }

    // ──────────────────────────────────────────────────────────
    //  Phase 2 — Planification par le manager
    // ──────────────────────────────────────────────────────────

    /**
     * Le manager fixe la date/heure/lieu et confirme l'entretien.
     * Status PENDING_SCHEDULING → SCHEDULED ; envoi de la convocation officielle au candidat.
     */
    public Interview scheduleByManager(Long interviewId,
                                       LocalDateTime scheduledDate,
                                       String location,
                                       String interviewer,
                                       String managerUsername) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Entretien non trouvé avec l'ID: " + interviewId));

        if (!managerUsername.equals(interview.getManagerUsername())) {
            throw new RuntimeException("Vous n'êtes pas le manager assigné à cet entretien.");
        }
        if (interview.getStatus() != InterviewStatus.PENDING_SCHEDULING
                && interview.getStatus() != InterviewStatus.SCHEDULED) {
            throw new RuntimeException("Cet entretien ne peut plus être planifié (status: " + interview.getStatus() + ").");
        }
        if (scheduledDate == null) {
            throw new RuntimeException("La date et l'heure de l'entretien sont requises.");
        }

        interview.setScheduledDate(scheduledDate);
        if (location != null) interview.setLocation(location);
        // Par défaut, l'intervieweur est le manager lui-même
        interview.setInterviewer(interviewer != null && !interviewer.isBlank()
                ? interviewer : interview.getManagerName());
        interview.setStatus(InterviewStatus.SCHEDULED);
        interview.setScheduledAt(LocalDateTime.now());

        Interview saved = interviewRepository.save(interview);

        // Convocation officielle au candidat avec .ics
        emailService.sendConvocation(saved, saved.getCandidateEmail(),
                saved.getCandidateName(), saved.getJobOfferTitle());

        log.info("Entretien #{} planifié par {} pour le {}",
                saved.getId(), managerUsername, scheduledDate);
        return saved;
    }

    // ──────────────────────────────────────────────────────────
    //  Refus par le manager
    // ──────────────────────────────────────────────────────────

    /**
     * Le manager refuse l'affectation (motif obligatoire).
     * Status → REJECTED_BY_MANAGER ; le RH est notifié et doit réaffecter.
     */
    public Interview rejectAssignment(Long interviewId, String reason, String managerUsername) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Entretien non trouvé avec l'ID: " + interviewId));

        if (!managerUsername.equals(interview.getManagerUsername())) {
            throw new RuntimeException("Vous n'êtes pas le manager assigné à cet entretien.");
        }
        if (interview.getStatus() != InterviewStatus.PENDING_SCHEDULING) {
            throw new RuntimeException("Seuls les entretiens en attente de planification peuvent être refusés.");
        }
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("Un motif de refus est requis.");
        }

        interview.setStatus(InterviewStatus.REJECTED_BY_MANAGER);
        interview.setRejectionReason(reason.trim());

        Interview saved = interviewRepository.save(interview);
        emailService.sendRejectionToRh(saved);

        log.info("Entretien #{} refusé par {} (motif: {})", saved.getId(), managerUsername, reason);
        return saved;
    }

    // ──────────────────────────────────────────────────────────
    //  Vue & mise à jour
    // ──────────────────────────────────────────────────────────

    /** Liste les entretiens d'une candidature */
    @Transactional(readOnly = true)
    public List<Interview> getInterviewsByApplication(Long applicationId) {
        return interviewRepository.findByApplicationId(applicationId);
    }

    /** Liste tous les entretiens (vue HR Admin) — PENDING_SCHEDULING en tête. */
    @Transactional(readOnly = true)
    public List<Interview> getAllInterviews() {
        return interviewRepository.findAllSorted();
    }

    /** Entretiens assignés à un manager (vue MANAGER) — à planifier en tête. */
    @Transactional(readOnly = true)
    public List<Interview> getInterviewsByManager(String managerUsername) {
        return interviewRepository.findByManagerSorted(managerUsername);
    }

    /**
     * Met à jour un entretien (notes, résultat, statut, lieu...).
     * - RH Admin (requesterUsername=null) : peut tout modifier.
     * - MANAGER  : doit être l'assigné, ne peut pas changer manager ni candidat.
     *
     * <p>Side effect : si le résultat passe à <code>POSITIF</code> pour un candidat interne,
     * la candidature est marquée RETENU et l'employé est promu au titre de l'offre.</p>
     */
    public Interview updateInterview(Long id, Interview interviewDetails,
                                     String requesterUsername, String bearerToken) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien non trouvé avec l'ID: " + id));

        if (requesterUsername != null
                && !requesterUsername.equals(interview.getManagerUsername())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier cet entretien.");
        }

        String previousResult = interview.getResult();

        if (interviewDetails.getScheduledDate() != null) {
            interview.setScheduledDate(interviewDetails.getScheduledDate());
        }
        if (interviewDetails.getInterviewer() != null) {
            interview.setInterviewer(interviewDetails.getInterviewer());
        }
        if (interviewDetails.getNotes() != null) {
            interview.setNotes(interviewDetails.getNotes());
        }
        if (interviewDetails.getResult() != null) {
            interview.setResult(interviewDetails.getResult());
        }
        if (interviewDetails.getStatus() != null) {
            interview.setStatus(interviewDetails.getStatus());
        }
        if (interviewDetails.getLocation() != null) {
            interview.setLocation(interviewDetails.getLocation());
        }
        // Le manager assigné, le type candidat et la note RH ne peuvent être changés que par le RH
        if (requesterUsername == null) {
            if (interviewDetails.getManagerUsername() != null) {
                interview.setManagerUsername(interviewDetails.getManagerUsername());
            }
            if (interviewDetails.getManagerName() != null) {
                interview.setManagerName(interviewDetails.getManagerName());
            }
            if (interviewDetails.getCandidateType() != null) {
                interview.setCandidateType(interviewDetails.getCandidateType());
            }
            if (interviewDetails.getCandidateEmail() != null) {
                interview.setCandidateEmail(interviewDetails.getCandidateEmail());
            }
            if (interviewDetails.getRhNote() != null) {
                interview.setRhNote(interviewDetails.getRhNote());
            }
        }

        Interview saved = interviewRepository.save(interview);

        // Promotion automatique : entretien positif pour candidat interne → RETENU + maj poste employé.
        boolean becamePositive = "POSITIF".equalsIgnoreCase(saved.getResult())
                && !"POSITIF".equalsIgnoreCase(previousResult);
        if (becamePositive && saved.getCandidateType() == CandidateType.INTERNAL) {
            promoteInternalCandidate(saved, bearerToken);
        }
        return saved;
    }

    /**
     * Passe l'Application en RETENU et appelle employee-service pour mettre à jour
     * le poste de l'employé avec le titre de l'offre. Best-effort : un échec côté
     * employee-service n'invalide pas le résultat de l'entretien.
     */
    private void promoteInternalCandidate(Interview interview, String bearerToken) {
        Application app = interview.getApplication();
        if (app == null) return;

        // 1) Statut candidature → RETENU (visible pour l'employé dans /employee/applications)
        if (app.getStatus() != ApplicationStatus.RETENU) {
            app.setStatus(ApplicationStatus.RETENU);
            applicationRepository.save(app);
        }

        // 2) Mise à jour du poste de l'employé + historique de carrière (reason=PROMOTION)
        String newPosition = app.getJobOfferTitle();
        String matricule = app.getEmployeeMatricule();
        if (newPosition != null && !newPosition.isBlank()
                && matricule != null && !matricule.isBlank()) {
            String notes = "Promotion suite à entretien positif" +
                    (interview.getJobOfferTitle() != null ? " (offre : " + interview.getJobOfferTitle() + ")" : "");
            boolean ok = employeeClient.updateEmployeePosition(
                    matricule, newPosition,
                    "PROMOTION",
                    app.getId(),
                    interview.getManagerName() != null ? interview.getManagerName() : interview.getManagerUsername(),
                    notes,
                    bearerToken);
            if (ok) {
                log.info("Employé matricule={} promu au poste « {} » (entretien #{} positif)",
                        matricule, newPosition, interview.getId());
            } else {
                log.warn("Promotion non appliquée côté employee-service pour matricule={} (entretien #{})",
                        matricule, interview.getId());
            }
        }
    }

    /** Récupère un entretien par son ID */
    @Transactional(readOnly = true)
    public Optional<Interview> getInterviewById(Long id) {
        return interviewRepository.findById(id);
    }

    /** Vérifie qu'un entretien est bien assigné au manager donné. */
    @Transactional(readOnly = true)
    public boolean isAssignedTo(Long interviewId, String managerUsername) {
        return interviewRepository.findById(interviewId)
                .map(i -> managerUsername != null && managerUsername.equals(i.getManagerUsername()))
                .orElse(false);
    }

    // ──────────────────────────────────────────────────────────
    //  Recommandation de formation par le manager
    // ──────────────────────────────────────────────────────────

    /**
     * Le manager saisit un plan de formation pour un candidat classé "À Former" (TRAINING).
     * Stocke le détail sur l'entretien et marque la candidature comme `trainingRecommended`
     * pour qu'elle remonte dans le pipeline RH.
     */
    public Interview recommendTraining(Long interviewId,
                                       String trainingPlan,
                                       String trainingDuration,
                                       String trainingNotes,
                                       String managerUsername) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Entretien non trouvé avec l'ID: " + interviewId));

        if (!managerUsername.equals(interview.getManagerUsername())) {
            throw new RuntimeException("Vous n'êtes pas le manager assigné à cet entretien.");
        }
        if (interview.getCandidateType() != CandidateType.INTERNAL) {
            throw new RuntimeException("La recommandation de formation n'est applicable qu'aux candidats internes.");
        }
        if (trainingPlan == null || trainingPlan.isBlank()) {
            throw new RuntimeException("Le plan de formation est requis.");
        }

        interview.setTrainingPlan(trainingPlan.trim());
        interview.setTrainingDuration(trainingDuration != null ? trainingDuration.trim() : null);
        interview.setTrainingNotes(trainingNotes != null ? trainingNotes.trim() : null);
        interview.setTrainingRecommendedAt(LocalDateTime.now());

        // Reflet côté Application pour que le RH voie la reco dans son pipeline.
        if (interview.getApplication() != null) {
            Application app = interview.getApplication();
            app.setTrainingRecommended(true);
            app.setTrainingRecommendedAt(LocalDateTime.now());
            applicationRepository.save(app);
        }

        Interview saved = interviewRepository.save(interview);
        log.info("Formation recommandée pour entretien #{} par {}", saved.getId(), managerUsername);
        return saved;
    }

    /**
     * Statistiques d'activité du manager connecté pour son dashboard.
     * Renvoie : nombre d'entretiens par statut, par résultat, ratio d'acceptation,
     * activité des 6 derniers mois, et la liste des 5 prochains entretiens planifiés.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getManagerStats(String managerUsername) {
        List<Interview> all = interviewRepository.findByManagerSorted(managerUsername);

        int pending = 0, scheduled = 0, completed = 0, cancelled = 0, rejected = 0;
        int positive = 0, negative = 0, inProgress = 0;
        int trainingRecommended = 0;
        // Fenêtre d'activité : 6 derniers jours (jour courant inclus).
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate sixDaysAgo = today.minusDays(5); // bornes inclusives [J-5 ; J0]
        LocalDateTime windowStart = sixDaysAgo.atStartOfDay();

        java.util.Map<String, java.util.Map<String, Integer>> daily = new java.util.LinkedHashMap<>();
        // Pré-remplissage des 6 derniers jours pour avoir un graphe stable même sans données.
        for (int i = 5; i >= 0; i--) {
            java.time.LocalDate day = today.minusDays(i);
            String key = day.toString(); // "YYYY-MM-DD"
            java.util.Map<String, Integer> m = new java.util.HashMap<>();
            m.put("total", 0);
            m.put("positive", 0);
            m.put("negative", 0);
            daily.put(key, m);
        }

        for (Interview i : all) {
            if (i.getStatus() != null) {
                switch (i.getStatus()) {
                    case PENDING_SCHEDULING: pending++; break;
                    case SCHEDULED: scheduled++; break;
                    case COMPLETED: completed++; break;
                    case CANCELLED: cancelled++; break;
                    case REJECTED_BY_MANAGER: rejected++; break;
                }
            }
            if (i.getResult() != null) {
                String r = i.getResult().toUpperCase();
                if (r.equals("POSITIF")) positive++;
                else if (r.equals("NEGATIF") || r.equals("NÉGATIF")) negative++;
                else if (r.equals("EN_COURS")) inProgress++;
            }
            if (i.getTrainingRecommendedAt() != null) trainingRecommended++;

            LocalDateTime ref = i.getScheduledDate() != null ? i.getScheduledDate() : i.getAssignedAt();
            if (ref != null && !ref.isBefore(windowStart)) {
                String key = ref.toLocalDate().toString();
                java.util.Map<String, Integer> m = daily.get(key);
                if (m != null) {
                    m.merge("total", 1, Integer::sum);
                    if (i.getResult() != null) {
                        String r = i.getResult().toUpperCase();
                        if (r.equals("POSITIF")) m.merge("positive", 1, Integer::sum);
                        else if (r.equals("NEGATIF") || r.equals("NÉGATIF")) m.merge("negative", 1, Integer::sum);
                    }
                }
            }
        }

        // Taux d'acceptation : positifs / (positifs + négatifs), évite la dilution par les en-cours.
        int decided = positive + negative;
        double acceptanceRate = decided > 0 ? Math.round((positive * 1000.0 / decided)) / 10.0 : 0.0;

        // 5 prochains entretiens SCHEDULED, ordre chronologique croissant.
        LocalDateTime now = LocalDateTime.now();
        List<Map<String, Object>> upcoming = all.stream()
                .filter(i -> i.getStatus() == InterviewStatus.SCHEDULED && i.getScheduledDate() != null
                        && i.getScheduledDate().isAfter(now))
                .sorted(java.util.Comparator.comparing(Interview::getScheduledDate))
                .limit(5)
                .map(i -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", i.getId());
                    m.put("scheduledDate", i.getScheduledDate());
                    m.put("candidateName", i.getCandidateName());
                    m.put("jobOfferTitle", i.getJobOfferTitle());
                    m.put("location", i.getLocation());
                    m.put("candidateType", i.getCandidateType() != null ? i.getCandidateType().name() : null);
                    return m;
                })
                .toList();

        // Conversion daily map → liste ordonnée pour faciliter le rendu côté front.
        List<Map<String, Object>> dailyList = new java.util.ArrayList<>();
        for (var entry : daily.entrySet()) {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("day", entry.getKey()); // "YYYY-MM-DD"
            m.put("total", entry.getValue().get("total"));
            m.put("positive", entry.getValue().get("positive"));
            m.put("negative", entry.getValue().get("negative"));
            dailyList.add(m);
        }

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("pendingScheduling", pending);
        result.put("scheduled", scheduled);
        result.put("completed", completed);
        result.put("cancelled", cancelled);
        result.put("rejected", rejected);
        result.put("positive", positive);
        result.put("negative", negative);
        result.put("inProgress", inProgress);
        result.put("trainingRecommended", trainingRecommended);
        result.put("total", all.size());
        result.put("acceptanceRate", acceptanceRate); // pourcentage
        result.put("upcoming", upcoming);
        // Renommé en "daily" mais on garde aussi "monthly" comme alias pour compatibilité
        // si une vue front charge encore la donnée sous ce nom.
        result.put("daily", dailyList);
        result.put("monthly", dailyList);
        return result;
    }

    // ──────────────────────────────────────────────────────────
    //  Suivi des formations (vue manager + vue employé)
    // ──────────────────────────────────────────────────────────

    /**
     * Programmes de formation pilotés par le manager connecté.
     * Source : tous les Interviews du manager ayant {@code trainingRecommendedAt != null}
     * pour un candidat interne, enrichis des skills cibles vs niveaux actuels.
     */
    @Transactional(readOnly = true)
    public List<TrainingProgramView> getManagerTrainingPrograms(String managerUsername, String bearerToken) {
        return interviewRepository.findByManagerSorted(managerUsername).stream()
                .filter(i -> i.getTrainingRecommendedAt() != null)
                .filter(i -> i.getCandidateType() == CandidateType.INTERNAL)
                .map(i -> toTrainingView(i, bearerToken))
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    /**
     * Programmes de formation visibles par l'employé connecté (read-only).
     * Filtre : Interviews dont l'Application.employeeMatricule == employé courant.
     */
    @Transactional(readOnly = true)
    public List<TrainingProgramView> getEmployeeTrainingPrograms(String matricule, String bearerToken) {
        if (matricule == null || matricule.isBlank()) return List.of();
        // Pas d'index dédié pour l'instant : on filtre via JPQL custom léger via repo méthode existante.
        // Comme l'employé n'a typiquement qu'1-2 programmes, un scan complet est acceptable v1.
        return interviewRepository.findAll().stream()
                .filter(i -> i.getTrainingRecommendedAt() != null)
                .filter(i -> i.getCandidateType() == CandidateType.INTERNAL)
                .filter(i -> i.getApplication() != null
                        && matricule.equals(i.getApplication().getEmployeeMatricule()))
                .map(i -> toTrainingView(i, bearerToken))
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    /**
     * Construit la vue consolidée pour un Interview donné.
     * Récupère les skills de l'offre (source de vérité des cibles) et les skills actuels
     * de l'employé via employee-service. Renvoie null si l'Application est absente.
     */
    private TrainingProgramView toTrainingView(Interview interview, String bearerToken) {
        Application app = interview.getApplication();
        if (app == null) return null;

        String matricule = app.getEmployeeMatricule();

        // Skills actuels de l'employé (peut être vide si lookup échoue)
        java.util.Map<Long, Integer> currentLevels = new java.util.HashMap<>();
        if (matricule != null && bearerToken != null) {
            CandidateProfile profile = employeeClient.getCandidateProfile(matricule, bearerToken);
            if (profile != null && profile.getSkills() != null) {
                for (CandidateProfile.CandidateSkill s : profile.getSkills()) {
                    if (s.getSkillId() != null && s.getLevel() != null) {
                        currentLevels.put(s.getSkillId(), s.getLevel());
                    }
                }
            }
        }

        // Skills cibles depuis la JobOffer (skills + skillLevels)
        List<TrainingProgramView.TrainingSkillView> skillViews = new java.util.ArrayList<>();
        if (app.getJobOfferId() != null) {
            JobOffer offer = jobOfferRepository.findById(app.getJobOfferId()).orElse(null);
            if (offer != null) {
                java.util.Map<Long, Integer> required = offer.getSkillLevels() != null
                        ? offer.getSkillLevels() : java.util.Collections.emptyMap();
                for (Skill skill : offer.getSkills()) {
                    Integer req = required.getOrDefault(skill.getId(), 3);
                    Integer current = currentLevels.get(skill.getId());
                    boolean acquired = current != null && current >= req;
                    skillViews.add(TrainingProgramView.TrainingSkillView.builder()
                            .skillId(skill.getId())
                            .skillName(skill.getName())
                            .requiredLevel(req)
                            .currentLevel(current)
                            .acquired(acquired)
                            .build());
                }
            }
        }

        int total = skillViews.size();
        int acquired = (int) skillViews.stream().filter(TrainingProgramView.TrainingSkillView::isAcquired).count();
        boolean ready = total > 0 && acquired == total;

        return TrainingProgramView.builder()
                .interviewId(interview.getId())
                .applicationId(app.getId())
                .candidateName(interview.getCandidateName())
                .candidateMatricule(matricule)
                .candidateEmail(interview.getCandidateEmail())
                .jobOfferId(interview.getJobOfferId())
                .jobOfferTitle(interview.getJobOfferTitle())
                .managerUsername(interview.getManagerUsername())
                .managerName(interview.getManagerName())
                .managerEmail(interview.getManagerEmail())
                .trainingPlan(interview.getTrainingPlan())
                .trainingDuration(interview.getTrainingDuration())
                .trainingNotes(interview.getTrainingNotes())
                .trainingRecommendedAt(interview.getTrainingRecommendedAt())
                .baselineScore(interview.getMatchingScore())
                .skills(skillViews)
                .skillsAcquired(acquired)
                .skillsTotal(total)
                .readyForInterview(ready)
                .interviewStatus(interview.getStatus() != null ? interview.getStatus().name() : null)
                .interviewResult(interview.getResult())
                .build();
    }

    /**
     * Met à jour le plan de formation (texte) sur un entretien existant.
     * Variante de {@link #recommendTraining} qui n'exige pas que tous les champs soient renseignés —
     * sert au manager pour ajuster le plan en cours de formation.
     */
    public Interview updateTrainingPlan(Long interviewId, String trainingPlan, String trainingDuration,
                                        String trainingNotes, String managerUsername) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Entretien non trouvé avec l'ID: " + interviewId));
        if (!managerUsername.equals(interview.getManagerUsername())) {
            throw new RuntimeException("Vous n'êtes pas le manager assigné à cet entretien.");
        }
        if (interview.getTrainingRecommendedAt() == null) {
            throw new RuntimeException("Aucune formation en cours sur cet entretien.");
        }
        if (trainingPlan != null) interview.setTrainingPlan(trainingPlan.trim());
        if (trainingDuration != null) interview.setTrainingDuration(trainingDuration.trim());
        if (trainingNotes != null) interview.setTrainingNotes(trainingNotes.trim());
        return interviewRepository.save(interview);
    }

    /**
     * Renvoyer la convocation (utile si le 1er envoi a échoué). RH only.
     * Refuse si l'entretien n'est pas encore SCHEDULED.
     */
    public void resendConvocation(Long interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Entretien non trouvé avec l'ID: " + interviewId));
        if (interview.getStatus() != InterviewStatus.SCHEDULED) {
            throw new RuntimeException("Convocation impossible : l'entretien n'est pas encore planifié.");
        }
        emailService.sendConvocation(interview, interview.getCandidateEmail(),
                interview.getCandidateName(), interview.getJobOfferTitle());
    }
}
