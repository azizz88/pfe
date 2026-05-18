package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.client.EmployeeClient;
import com.aziz.recruitmentservice.dto.CandidateProfile;
import com.aziz.recruitmentservice.dto.MatchingResponse;
import com.aziz.recruitmentservice.dto.MatchingResult;
import com.aziz.recruitmentservice.dto.StatusUpdateRequest;
import com.aziz.recruitmentservice.entities.Application;
import com.aziz.recruitmentservice.entities.ApplicationStatus;
import com.aziz.recruitmentservice.entities.JobOffer;
import com.aziz.recruitmentservice.entities.Skill;
import com.aziz.recruitmentservice.repositories.ApplicationRepository;
import com.aziz.recruitmentservice.repositories.JobOfferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Moteur de matching IA entre une offre d'emploi et les candidats internes.
 *
 * Score global = w1 * Sskills + w2 * Sseniority
 *   - Sskills : similarité pondérée (vecteur niveau requis vs niveau acquis)
 *   - Sseniority : bonus selon les années d'ancienneté (plafonné à 8 ans)
 *
 * Catégories :
 *   - score >= 80 → IDEAL
 *   - 60 <= score < 80 → TRAINING (gap identifié)
 *   - score < 60 → EXTERNAL (recommander recrutement externe)
 */
@Service
public class MatchingService {

    /** Poids des compétences dans le score global */
    private static final double W_SKILLS = 0.75;
    /** Poids de l'ancienneté */
    private static final double W_SENIORITY = 0.25;

    /** Seuil "candidat idéal" */
    private static final double THRESHOLD_IDEAL = 80.0;
    /** Seuil "à former" */
    private static final double THRESHOLD_TRAINING = 60.0;

    /** Ancienneté maximale prise en compte (en années) */
    private static final double SENIORITY_MAX_YEARS = 8.0;

    private final JobOfferRepository jobOfferRepository;
    private final ApplicationRepository applicationRepository;
    private final EmployeeClient employeeClient;

    public MatchingService(JobOfferRepository jobOfferRepository,
                           ApplicationRepository applicationRepository,
                           EmployeeClient employeeClient) {
        this.jobOfferRepository = jobOfferRepository;
        this.applicationRepository = applicationRepository;
        this.employeeClient = employeeClient;
    }

    /**
     * Lance le matching pour une offre : retourne les candidats triés par score décroissant
     * + un diagnostic permettant à l'UI d'identifier précisément le problème si la liste est vide.
     */
    @Transactional(readOnly = true)
    public MatchingResponse matchCandidatesForOffer(Long offerId, String bearerToken) {
        JobOffer offer = jobOfferRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée : " + offerId));

        MatchingResponse.Diagnostic diag = MatchingResponse.Diagnostic.builder()
                .offerTitle(offer.getTitle())
                .skillRequirementsCount(0)
                .applicationsCount(0)
                .profilesLoaded(0)
                .candidatesWithSkills(0)
                .reason("OK")
                .build();

        // === Étape 1 : compétences requises ===
        Map<Long, Integer> requirements = buildRequirements(offer);
        diag.setSkillRequirementsCount(requirements.size());

        // === Étape 2 : candidatures ===
        List<Application> applications = applicationRepository.findByJobOfferId(offerId);
        diag.setApplicationsCount(applications.size());

        if (requirements.isEmpty()) {
            diag.setReason("NO_SKILLS_ON_OFFER");
            return MatchingResponse.builder().results(Collections.emptyList()).diagnostic(diag).build();
        }
        if (applications.isEmpty()) {
            diag.setReason("NO_APPLICATIONS");
            return MatchingResponse.builder().results(Collections.emptyList()).diagnostic(diag).build();
        }

        // === Étape 3 : scoring des candidats ===
        Map<Long, String> skillNames = offer.getSkills().stream()
                .collect(Collectors.toMap(Skill::getId, Skill::getName, (a, b) -> a));

        List<MatchingResult> results = new ArrayList<>();
        int profilesLoaded = 0;
        int candidatesWithSkills = 0;
        for (Application app : applications) {
            CandidateProfile profile = employeeClient.getCandidateProfile(app.getEmployeeMatricule(), bearerToken);
            if (profile == null) continue;
            profilesLoaded++;
            if (profile.getSkills() != null && !profile.getSkills().isEmpty()) candidatesWithSkills++;

            results.add(scoreCandidate(profile, requirements, skillNames, app));
        }
        diag.setProfilesLoaded(profilesLoaded);
        diag.setCandidatesWithSkills(candidatesWithSkills);

        if (results.isEmpty()) {
            diag.setReason("NO_CANDIDATE_PROFILES");
        }

        results.sort(Comparator.comparingDouble(MatchingResult::getScore).reversed());
        return MatchingResponse.builder().results(results).diagnostic(diag).build();
    }

    /**
     * Applique les mises à jour de statut validées par le RH.
     * Sauvegarde aussi la catégorie + score du matching pour la vue Pipeline.
     * Retourne le nombre de candidatures effectivement mises à jour.
     */
    @Transactional
    public int applyStatusUpdates(StatusUpdateRequest request) {
        if (request == null || request.getUpdates() == null) return 0;
        int updated = 0;
        for (StatusUpdateRequest.Item item : request.getUpdates()) {
            if (item.getApplicationId() == null || item.getStatus() == null) continue;
            ApplicationStatus target;
            try {
                target = ApplicationStatus.valueOf(item.getStatus());
            } catch (IllegalArgumentException e) {
                continue;
            }
            applicationRepository.findById(item.getApplicationId()).ifPresent(app -> {
                app.setStatus(target);
                if (item.getMatchingCategory() != null) app.setMatchingCategory(item.getMatchingCategory());
                if (item.getMatchingScore() != null) app.setMatchingScore(item.getMatchingScore());
                applicationRepository.save(app);
            });
            updated++;
        }
        return updated;
    }

    /**
     * Marque une candidature comme "à former" — pipeline de formation interne.
     */
    @Transactional
    public boolean recommendTraining(Long applicationId) {
        return applicationRepository.findById(applicationId).map(app -> {
            app.setTrainingRecommended(true);
            app.setTrainingRecommendedAt(LocalDateTime.now());
            applicationRepository.save(app);
            return true;
        }).orElse(false);
    }

    private Map<Long, Integer> buildRequirements(JobOffer offer) {
        Map<Long, Integer> req = new HashMap<>();
        if (offer.getSkills() == null) return req;
        for (Skill s : offer.getSkills()) {
            Integer level = (offer.getSkillLevels() != null) ? offer.getSkillLevels().get(s.getId()) : null;
            req.put(s.getId(), (level == null || level < 1 || level > 5) ? 3 : level);
        }
        return req;
    }

    private MatchingResult scoreCandidate(CandidateProfile profile,
                                          Map<Long, Integer> requirements,
                                          Map<Long, String> skillNames,
                                          Application application) {
        // Index des compétences du candidat
        Map<Long, Integer> candidateSkills = new HashMap<>();
        if (profile.getSkills() != null) {
            for (CandidateProfile.CandidateSkill cs : profile.getSkills()) {
                if (cs.getSkillId() != null && cs.getLevel() != null) {
                    candidateSkills.put(cs.getSkillId(), cs.getLevel());
                }
            }
        }

        // === Score compétences : moyenne pondérée des ratios (min(actual, required) / required) ===
        double totalRequired = 0;
        double totalCovered = 0;
        List<MatchingResult.SkillGap> gaps = new ArrayList<>();

        for (Map.Entry<Long, Integer> req : requirements.entrySet()) {
            int requiredLvl = req.getValue();
            Integer actualLvl = candidateSkills.get(req.getKey());

            totalRequired += requiredLvl;
            int effective = (actualLvl == null) ? 0 : Math.min(actualLvl, requiredLvl);
            totalCovered += effective;

            if (actualLvl == null || actualLvl < requiredLvl) {
                gaps.add(MatchingResult.SkillGap.builder()
                        .skillId(req.getKey())
                        .skillName(skillNames.getOrDefault(req.getKey(), "?"))
                        .requiredLevel(requiredLvl)
                        .actualLevel(actualLvl)
                        .build());
            }
        }

        double skillsScore = (totalRequired == 0) ? 0 : (totalCovered / totalRequired) * 100.0;

        // === Score ancienneté : bonus linéaire jusqu'à SENIORITY_MAX_YEARS ===
        double seniorityScore = computeSeniorityScore(profile.getHireDate());

        // === Score global pondéré ===
        double globalScore = (W_SKILLS * skillsScore) + (W_SENIORITY * seniorityScore);
        globalScore = Math.round(globalScore * 100.0) / 100.0;

        String category;
        if (globalScore >= THRESHOLD_IDEAL) category = "IDEAL";
        else if (globalScore >= THRESHOLD_TRAINING) category = "TRAINING";
        else category = "EXTERNAL";

        // ── Statut proposé : seulement si la candidature est encore en attente ──
        String currentStatus = application.getStatus() != null ? application.getStatus().name() : "EN_ATTENTE";
        String proposedStatus = null;
        if ("EN_ATTENTE".equals(currentStatus)) {
            switch (category) {
                case "IDEAL":
                case "TRAINING":
                    proposedStatus = "ENTRETIEN";
                    break;
                case "EXTERNAL":
                    proposedStatus = "REFUSE";
                    break;
            }
        }

        String applicantName = application.getApplicantName();

        return MatchingResult.builder()
                .applicationId(application.getId())
                .employeeMatricule(profile.getMatricule())
                .applicantName(applicantName != null ? applicantName : profile.getFullName())
                .score(globalScore)
                .skillsScore(Math.round(skillsScore * 100.0) / 100.0)
                .seniorityScore(Math.round(seniorityScore * 100.0) / 100.0)
                .category(category)
                .gaps(gaps)
                .currentStatus(currentStatus)
                .proposedStatus(proposedStatus)
                .build();
    }

    private double computeSeniorityScore(LocalDate hireDate) {
        if (hireDate == null) return 0;
        double years = ChronoUnit.DAYS.between(hireDate, LocalDate.now()) / 365.25;
        if (years < 0) return 0;
        double ratio = Math.min(years / SENIORITY_MAX_YEARS, 1.0);
        return ratio * 100.0;
    }
}
