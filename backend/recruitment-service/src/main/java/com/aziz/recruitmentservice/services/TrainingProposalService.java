package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.client.EmployeeClient;
import com.aziz.recruitmentservice.dto.TrainingProposalCreateRequest;
import com.aziz.recruitmentservice.entities.Application;
import com.aziz.recruitmentservice.entities.ApplicationStatus;
import com.aziz.recruitmentservice.entities.TrainingProposal;
import com.aziz.recruitmentservice.entities.TrainingProposalStatus;
import com.aziz.recruitmentservice.entities.TrainingProvider;
import com.aziz.recruitmentservice.repositories.ApplicationRepository;
import com.aziz.recruitmentservice.repositories.TrainingProposalRepository;
import com.aziz.recruitmentservice.repositories.TrainingProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service métier pour le workflow des propositions de formation.
 *
 * Transitions valides :
 *   create()    : * → PROPOSED
 *   accept()    : PROPOSED → ACCEPTED_BY_EMPLOYEE
 *   refuse()    : PROPOSED → REFUSED_BY_EMPLOYEE  (terminal)
 *   enroll()    : ACCEPTED_BY_EMPLOYEE → ENROLLED
 *   complete()  : ENROLLED → COMPLETED  (terminal, certificat optionnel)
 *   abandon()   : ACCEPTED_BY_EMPLOYEE | ENROLLED → ABANDONED  (terminal)
 *
 * Toute autre transition lève IllegalStateException.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class TrainingProposalService {

    private final TrainingProposalRepository proposalRepository;
    private final TrainingProviderRepository providerRepository;
    private final ApplicationRepository applicationRepository;
    private final EmployeeClient employeeClient;

    // ===================================================
    // Lecture
    // ===================================================

    @Transactional(readOnly = true)
    public List<TrainingProposal> getAll() {
        return proposalRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<TrainingProposal> getByManager(String managerUsername) {
        return proposalRepository.findByManagerUsernameOrderByCreatedAtDesc(managerUsername);
    }

    @Transactional(readOnly = true)
    public List<TrainingProposal> getByEmployee(String employeeMatricule) {
        return proposalRepository.findByEmployeeMatriculeOrderByCreatedAtDesc(employeeMatricule);
    }

    @Transactional(readOnly = true)
    public TrainingProposal getById(Long id) {
        return proposalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Proposition introuvable : " + id));
    }

    /** KPIs dashboard manager : compteur par statut. */
    @Transactional(readOnly = true)
    public Map<String, Long> getManagerStats(String managerUsername) {
        Map<String, Long> stats = new HashMap<>();
        for (TrainingProposalStatus s : TrainingProposalStatus.values()) {
            stats.put(s.name(), proposalRepository.countByManagerUsernameAndStatus(managerUsername, s));
        }
        return stats;
    }

    // ===================================================
    // Création (manager)
    // ===================================================

    public TrainingProposal create(TrainingProposalCreateRequest req, String managerUsername, String managerName) {
        if (req.getEmployeeMatricule() == null || req.getEmployeeMatricule().isBlank()) {
            throw new IllegalArgumentException("Matricule de l'employé requis.");
        }
        if (req.getProviderId() == null) {
            throw new IllegalArgumentException("L'organisme de formation est requis.");
        }
        TrainingProvider provider = providerRepository.findById(req.getProviderId())
                .orElseThrow(() -> new IllegalArgumentException("Organisme introuvable : " + req.getProviderId()));

        TrainingProposal proposal = TrainingProposal.builder()
                .employeeMatricule(req.getEmployeeMatricule().trim())
                .employeeName(req.getEmployeeName())
                .employeeEmail(req.getEmployeeEmail())
                .managerUsername(managerUsername)
                .managerName(managerName)
                .provider(provider)
                .sourceApplicationId(req.getSourceApplicationId())
                .missingSkillIds(req.getMissingSkillIds())
                .aiScore(req.getAiScore())
                .aiJustification(req.getAiJustification())
                .aiSource(req.getAiSource())
                .managerNotes(req.getManagerNotes())
                .status(TrainingProposalStatus.PROPOSED)
                .build();

        TrainingProposal saved = proposalRepository.save(proposal);
        log.info("[Proposal] Création #{} : employé={}, provider={}, manager={}",
                saved.getId(), saved.getEmployeeMatricule(), provider.getName(), managerUsername);
        return saved;
    }

    // ===================================================
    // Transitions employé
    // ===================================================

    /** L'employé accepte la formation proposée. */
    public TrainingProposal accept(Long id, String employeeMatricule) {
        TrainingProposal p = getById(id);
        ensureOwner(p, employeeMatricule, "accepter");
        ensureStatus(p, TrainingProposalStatus.PROPOSED, "accepter");
        p.setStatus(TrainingProposalStatus.ACCEPTED_BY_EMPLOYEE);
        p.setDecisionDate(LocalDateTime.now());
        return proposalRepository.save(p);
    }

    /** L'employé refuse la formation proposée (terminal). */
    public TrainingProposal refuse(Long id, String employeeMatricule) {
        TrainingProposal p = getById(id);
        ensureOwner(p, employeeMatricule, "refuser");
        ensureStatus(p, TrainingProposalStatus.PROPOSED, "refuser");
        p.setStatus(TrainingProposalStatus.REFUSED_BY_EMPLOYEE);
        p.setDecisionDate(LocalDateTime.now());
        return proposalRepository.save(p);
    }

    // ===================================================
    // Transitions manager
    // ===================================================

    /** Le manager confirme l'inscription effective auprès de l'organisme. */
    public TrainingProposal enroll(Long id, String managerUsername) {
        TrainingProposal p = getById(id);
        ensureManager(p, managerUsername, "inscrire");
        ensureStatus(p, TrainingProposalStatus.ACCEPTED_BY_EMPLOYEE, "inscrire");
        p.setStatus(TrainingProposalStatus.ENROLLED);
        p.setEnrollmentDate(LocalDateTime.now());
        return proposalRepository.save(p);
    }

    /**
     * Le manager marque la formation terminée, avec URL de certificat optionnelle.
     * <p>Side effect : si la proposition est liée à une candidature (sourceApplicationId),
     * la candidature passe automatiquement en RETENU et le poste de l'employé est mis à jour
     * (PositionHistory côté employee-service). Pas besoin d'un nouvel entretien — la fin de
     * formation = affectation effective au poste.</p>
     */
    public TrainingProposal complete(Long id, String managerUsername, String certificateUrl, String bearerToken) {
        TrainingProposal p = getById(id);
        ensureManager(p, managerUsername, "terminer");
        ensureStatus(p, TrainingProposalStatus.ENROLLED, "terminer");
        p.setStatus(TrainingProposalStatus.COMPLETED);
        p.setCompletionDate(LocalDateTime.now());
        if (certificateUrl != null && !certificateUrl.isBlank()) {
            p.setCertificateUrl(certificateUrl.trim());
        }
        TrainingProposal saved = proposalRepository.save(p);
        autoPromoteIfLinked(saved, bearerToken);
        return saved;
    }

    /**
     * Si la formation était liée à une candidature, ferme cette candidature en RETENU
     * et déclenche la mise à jour du poste de l'employé. Best-effort : un échec côté
     * employee-service n'invalide pas la complétion de la formation.
     */
    private void autoPromoteIfLinked(TrainingProposal p, String bearerToken) {
        if (p.getSourceApplicationId() == null) {
            log.info("[Proposal #{}] Pas de candidature source — pas d'auto-promotion.", p.getId());
            return;
        }
        Application app = applicationRepository.findById(p.getSourceApplicationId()).orElse(null);
        if (app == null) {
            log.warn("[Proposal #{}] sourceApplicationId={} introuvable — auto-promotion ignorée.",
                    p.getId(), p.getSourceApplicationId());
            return;
        }

        // 1) Candidature → RETENU (visible côté employé dans /employee/applications)
        if (app.getStatus() != ApplicationStatus.RETENU) {
            app.setStatus(ApplicationStatus.RETENU);
            applicationRepository.save(app);
            log.info("[Proposal #{}] Candidature #{} → RETENU (auto via fin de formation).",
                    p.getId(), app.getId());
        }

        // 2) Mise à jour du poste + historique de carrière
        String newPosition = app.getJobOfferTitle();
        String matricule = app.getEmployeeMatricule();
        if (newPosition != null && !newPosition.isBlank()
                && matricule != null && !matricule.isBlank()) {
            String notes = "Promotion suite à fin de formation chez "
                    + (p.getProvider() != null ? p.getProvider().getName() : "?")
                    + " (offre : " + newPosition + ")";
            boolean ok = employeeClient.updateEmployeePosition(
                    matricule, newPosition,
                    "PROMOTION",
                    app.getId(),
                    p.getManagerName() != null ? p.getManagerName() : p.getManagerUsername(),
                    notes,
                    bearerToken);
            if (ok) {
                log.info("[Proposal #{}] Employé {} promu au poste « {} » suite à formation.",
                        p.getId(), matricule, newPosition);
            } else {
                log.warn("[Proposal #{}] Mise à jour position échouée pour {} → {}.",
                        p.getId(), matricule, newPosition);
            }
        }
    }

    /** Le manager abandonne la formation en cours (terminal). */
    public TrainingProposal abandon(Long id, String managerUsername, String reason) {
        TrainingProposal p = getById(id);
        ensureManager(p, managerUsername, "abandonner");
        if (p.getStatus() != TrainingProposalStatus.ACCEPTED_BY_EMPLOYEE
                && p.getStatus() != TrainingProposalStatus.ENROLLED) {
            throw new IllegalStateException("Impossible d'abandonner une formation au statut " + p.getStatus());
        }
        p.setStatus(TrainingProposalStatus.ABANDONED);
        if (reason != null && !reason.isBlank()) {
            String prev = p.getManagerNotes() == null ? "" : p.getManagerNotes() + "\n";
            p.setManagerNotes(prev + "[Abandon] " + reason);
        }
        return proposalRepository.save(p);
    }

    // ===================================================
    // Helpers
    // ===================================================

    private void ensureStatus(TrainingProposal p, TrainingProposalStatus expected, String action) {
        if (p.getStatus() != expected) {
            throw new IllegalStateException(
                    "Impossible d'" + action + " : statut courant " + p.getStatus()
                            + ", attendu " + expected);
        }
    }

    private void ensureOwner(TrainingProposal p, String employeeMatricule, String action) {
        if (employeeMatricule == null || !employeeMatricule.equalsIgnoreCase(p.getEmployeeMatricule())) {
            throw new IllegalStateException("Seul l'employé concerné peut " + action + " cette proposition.");
        }
    }

    private void ensureManager(TrainingProposal p, String managerUsername, String action) {
        if (managerUsername == null || !managerUsername.equalsIgnoreCase(p.getManagerUsername())) {
            throw new IllegalStateException("Seul le manager auteur de la proposition peut " + action + ".");
        }
    }
}
