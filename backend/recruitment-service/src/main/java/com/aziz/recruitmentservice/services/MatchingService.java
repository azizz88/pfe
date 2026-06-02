package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.client.EmployeeClient;
import com.aziz.recruitmentservice.dto.CandidateProfile;
import com.aziz.recruitmentservice.dto.MatchingResponse;
import com.aziz.recruitmentservice.dto.MatchingResult;
import com.aziz.recruitmentservice.dto.StatusUpdateRequest;
import com.aziz.recruitmentservice.entities.Application;
import com.aziz.recruitmentservice.entities.ApplicationStatus;
import com.aziz.recruitmentservice.entities.ExternalCandidate;
import com.aziz.recruitmentservice.entities.ExternalCandidateSkill;
import com.aziz.recruitmentservice.entities.JobOffer;
import com.aziz.recruitmentservice.entities.Skill;
import com.aziz.recruitmentservice.repositories.ApplicationRepository;
import com.aziz.recruitmentservice.repositories.ExternalCandidateRepository;
import com.aziz.recruitmentservice.repositories.JobOfferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Moteur de matching IA entre une offre d'emploi et les candidats (internes et externes).
 *
 * Score global = w1 * Sskills + w2 * Sseniority
 *
 * Catégories :
 *   - score >= 80 → IDEAL
 *   - 60 <= score < 80 → TRAINING (gap identifié)
 *   - score < 60 → EXTERNAL (recommander recrutement externe)
 *
 * Internes : profil chargé via employee-service (matricule).
 * Externes : profil stocké en local (ExternalCandidate + ExternalCandidateSkill).
 */
@Service
public class MatchingService {

    private static final double W_SKILLS = 0.75;
    private static final double W_SENIORITY = 0.25;
    private static final double THRESHOLD_IDEAL = 80.0;
    private static final double THRESHOLD_TRAINING = 60.0;
    private static final double SENIORITY_MAX_YEARS = 8.0;

    private final JobOfferRepository jobOfferRepository;
    private final ApplicationRepository applicationRepository;
    private final ExternalCandidateRepository externalCandidateRepository;
    private final EmployeeClient employeeClient;

    public MatchingService(JobOfferRepository jobOfferRepository,
                           ApplicationRepository applicationRepository,
                           ExternalCandidateRepository externalCandidateRepository,
                           EmployeeClient employeeClient) {
        this.jobOfferRepository = jobOfferRepository;
        this.applicationRepository = applicationRepository;
        this.externalCandidateRepository = externalCandidateRepository;
        this.employeeClient = employeeClient;
    }

    // =========================================================
    // Matching CANDIDATS INTERNES (applications existantes)
    // =========================================================

    @Transactional(readOnly = true)
    public MatchingResponse matchCandidatesForOffer(Long offerId, String bearerToken) {
        JobOffer offer = loadOfferOrThrow(offerId);

        MatchingResponse.Diagnostic diag = MatchingResponse.Diagnostic.builder()
                .offerTitle(offer.getTitle())
                .skillRequirementsCount(0)
                .applicationsCount(0)
                .profilesLoaded(0)
                .candidatesWithSkills(0)
                .reason("OK")
                .build();

        Map<Long, Integer> requirements = buildRequirements(offer);
        diag.setSkillRequirementsCount(requirements.size());

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

        Map<Long, String> skillNames = skillNamesOf(offer);
        List<MatchingResult> results = new ArrayList<>();
        int profilesLoaded = 0;
        int candidatesWithSkills = 0;
        for (Application app : applications) {
            CandidateProfile profile = employeeClient.getCandidateProfile(app.getEmployeeMatricule(), bearerToken);
            if (profile == null) continue;
            profilesLoaded++;
            if (profile.getSkills() != null && !profile.getSkills().isEmpty()) candidatesWithSkills++;

            results.add(scoreInternalCandidate(profile, requirements, skillNames, app));
        }
        diag.setProfilesLoaded(profilesLoaded);
        diag.setCandidatesWithSkills(candidatesWithSkills);
        if (results.isEmpty()) diag.setReason("NO_CANDIDATE_PROFILES");

        results.sort(Comparator.comparingDouble(MatchingResult::getScore).reversed());
        return MatchingResponse.builder().results(results).diagnostic(diag).build();
    }

    // =========================================================
    // Matching CANDIDATS EXTERNES (pool local)
    // =========================================================

    /**
     * Score tous les candidats externes (pool) contre une offre.
     * Utilise EXACTEMENT le même algorithme que pour les candidats internes,
     * sur la base des compétences stockées localement (alimentées par /api/cv/extract).
     */
    @Transactional(readOnly = true)
    public MatchingResponse matchExternalCandidatesForOffer(Long offerId) {
        JobOffer offer = loadOfferOrThrow(offerId);

        MatchingResponse.Diagnostic diag = MatchingResponse.Diagnostic.builder()
                .offerTitle(offer.getTitle())
                .skillRequirementsCount(0)
                .applicationsCount(0)
                .profilesLoaded(0)
                .candidatesWithSkills(0)
                .reason("OK")
                .build();

        Map<Long, Integer> requirements = buildRequirements(offer);
        diag.setSkillRequirementsCount(requirements.size());

        List<ExternalCandidate> pool = externalCandidateRepository.findAll();
        diag.setApplicationsCount(pool.size());

        if (requirements.isEmpty()) {
            diag.setReason("NO_SKILLS_ON_OFFER");
            return MatchingResponse.builder().results(Collections.emptyList()).diagnostic(diag).build();
        }
        if (pool.isEmpty()) {
            diag.setReason("NO_APPLICATIONS");
            return MatchingResponse.builder().results(Collections.emptyList()).diagnostic(diag).build();
        }

        Map<Long, String> skillNames = skillNamesOf(offer);
        List<MatchingResult> results = new ArrayList<>();
        int candidatesWithSkills = 0;
        for (ExternalCandidate cand : pool) {
            if (cand.getSkills() != null && !cand.getSkills().isEmpty()) candidatesWithSkills++;
            results.add(scoreExternalCandidate(cand, requirements, skillNames));
        }
        diag.setProfilesLoaded(pool.size());
        diag.setCandidatesWithSkills(candidatesWithSkills);

        results.sort(Comparator.comparingDouble(MatchingResult::getScore).reversed());
        return MatchingResponse.builder().results(results).diagnostic(diag).build();
    }

    // =========================================================
    // Statut updates + recommandation formation (inchangé)
    // =========================================================

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
            // Le RH ne peut, après matching, qu'orienter le candidat vers l'entretien.
            // RETENU / REFUSE sont des décisions du manager (cf. InterviewService).
            if (target != ApplicationStatus.EN_ATTENTE && target != ApplicationStatus.ENTRETIEN) {
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

    @Transactional
    public boolean recommendTraining(Long applicationId) {
        return applicationRepository.findById(applicationId).map(app -> {
            app.setTrainingRecommended(true);
            app.setTrainingRecommendedAt(LocalDateTime.now());
            applicationRepository.save(app);
            return true;
        }).orElse(false);
    }

    /**
     * Calcule le contexte de formation pour une candidature : infos du candidat
     * + compétences manquantes (gaps) vs l'offre visée. Utilisé pour pré-remplir
     * et auto-déclencher la suggestion IA d'organismes depuis /manager/interviews.
     *
     * Retourne : { employeeMatricule, employeeName, jobOfferId, jobOfferTitle,
     *              missingSkillIds:[Long], missingSkillNames:[String] }
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getTrainingContext(Long applicationId, String bearerToken) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Candidature introuvable : " + applicationId));
        JobOffer offer = app.getJobOffer();
        if (offer == null) {
            throw new RuntimeException("Offre liée introuvable pour la candidature " + applicationId);
        }

        Map<Long, Integer> requirements = buildRequirements(offer);
        Map<Long, String> skillNames = skillNamesOf(offer);

        // Skills actuelles de l'employé via employee-service
        Map<Long, Integer> actualSkills = new HashMap<>();
        CandidateProfile profile = employeeClient.getCandidateProfile(app.getEmployeeMatricule(), bearerToken);
        if (profile != null && profile.getSkills() != null) {
            for (CandidateProfile.CandidateSkill s : profile.getSkills()) {
                if (s.getSkillId() != null && s.getLevel() != null) {
                    actualSkills.put(s.getSkillId(), s.getLevel());
                }
            }
        }

        // Gap = requis - actuel (positif = compétence à acquérir / niveau insuffisant)
        List<Long> missingIds = new ArrayList<>();
        List<String> missingNames = new ArrayList<>();
        for (Map.Entry<Long, Integer> req : requirements.entrySet()) {
            Integer actual = actualSkills.get(req.getKey());
            if (actual == null || actual < req.getValue()) {
                missingIds.add(req.getKey());
                missingNames.add(skillNames.getOrDefault(req.getKey(), "?"));
            }
        }

        Map<String, Object> out = new HashMap<>();
        out.put("employeeMatricule", app.getEmployeeMatricule());
        out.put("employeeName", profile != null && profile.getFullName() != null
                ? profile.getFullName() : app.getApplicantName());
        out.put("jobOfferId", offer.getId());
        out.put("jobOfferTitle", offer.getTitle());
        out.put("missingSkillIds", missingIds);
        out.put("missingSkillNames", missingNames);
        return out;
    }

    // =========================================================
    // Helpers de scoring (partagés interne / externe)
    // =========================================================

    private JobOffer loadOfferOrThrow(Long offerId) {
        return jobOfferRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée : " + offerId));
    }

    private Map<Long, String> skillNamesOf(JobOffer offer) {
        return offer.getSkills().stream()
                .collect(Collectors.toMap(Skill::getId, Skill::getName, (a, b) -> a));
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

    /** Score brut (skills + seniority + category + gaps) commun aux deux types de candidats. */
    private ScoreBlob computeScore(Map<Long, Integer> candidateSkills,
                                    LocalDate hireDate,
                                    Integer yearsExperience,
                                    Map<Long, Integer> requirements,
                                    Map<Long, String> skillNames) {
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

        // Seniority : hireDate (interne) ou yearsExperience (externe)
        double seniorityScore;
        if (hireDate != null) {
            seniorityScore = computeSeniorityScore(hireDate);
        } else if (yearsExperience != null) {
            double ratio = Math.min(yearsExperience / SENIORITY_MAX_YEARS, 1.0);
            seniorityScore = ratio * 100.0;
        } else {
            seniorityScore = 0;
        }

        double globalScore = (W_SKILLS * skillsScore) + (W_SENIORITY * seniorityScore);
        globalScore = Math.round(globalScore * 100.0) / 100.0;

        String category;
        if (globalScore >= THRESHOLD_IDEAL) category = "IDEAL";
        else if (globalScore >= THRESHOLD_TRAINING) category = "TRAINING";
        else category = "EXTERNAL";

        return new ScoreBlob(
                globalScore,
                Math.round(skillsScore * 100.0) / 100.0,
                Math.round(seniorityScore * 100.0) / 100.0,
                category,
                gaps
        );
    }

    private MatchingResult scoreInternalCandidate(CandidateProfile profile,
                                                   Map<Long, Integer> requirements,
                                                   Map<Long, String> skillNames,
                                                   Application application) {
        Map<Long, Integer> candidateSkills = new HashMap<>();
        if (profile.getSkills() != null) {
            for (CandidateProfile.CandidateSkill cs : profile.getSkills()) {
                if (cs.getSkillId() != null && cs.getLevel() != null) {
                    candidateSkills.put(cs.getSkillId(), cs.getLevel());
                }
            }
        }

        ScoreBlob s = computeScore(candidateSkills, profile.getHireDate(), null, requirements, skillNames);

        String currentStatus = application.getStatus() != null ? application.getStatus().name() : "EN_ATTENTE";
        String proposedStatus = null;
        if ("EN_ATTENTE".equals(currentStatus)) {
            switch (s.category) {
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
                .source("INTERNAL")
                .employeeMatricule(profile.getMatricule())
                .applicantName(applicantName != null ? applicantName : profile.getFullName())
                .score(s.score)
                .skillsScore(s.skillsScore)
                .seniorityScore(s.seniorityScore)
                .category(s.category)
                .gaps(s.gaps)
                .currentStatus(currentStatus)
                .proposedStatus(proposedStatus)
                .build();
    }

    private MatchingResult scoreExternalCandidate(ExternalCandidate cand,
                                                   Map<Long, Integer> requirements,
                                                   Map<Long, String> skillNames) {
        Map<Long, Integer> candidateSkills = new HashMap<>();
        if (cand.getSkills() != null) {
            for (ExternalCandidateSkill cs : cand.getSkills()) {
                if (cs.getSkillId() != null && cs.getLevel() != null) {
                    candidateSkills.put(cs.getSkillId(), cs.getLevel());
                }
            }
        }

        ScoreBlob s = computeScore(candidateSkills, null, cand.getYearsOfExperience(), requirements, skillNames);

        String fullName = ((cand.getFirstName() != null ? cand.getFirstName() : "")
                + " " + (cand.getLastName() != null ? cand.getLastName() : "")).trim();

        return MatchingResult.builder()
                .externalCandidateId(cand.getId())
                .source("EXTERNAL")
                .candidateEmail(cand.getEmail())
                .applicantName(fullName)
                .score(s.score)
                .skillsScore(s.skillsScore)
                .seniorityScore(s.seniorityScore)
                .category(s.category)
                .gaps(s.gaps)
                .build();
    }

    private double computeSeniorityScore(LocalDate hireDate) {
        if (hireDate == null) return 0;
        double years = ChronoUnit.DAYS.between(hireDate, LocalDate.now()) / 365.25;
        if (years < 0) return 0;
        double ratio = Math.min(years / SENIORITY_MAX_YEARS, 1.0);
        return ratio * 100.0;
    }

    /** Container interne pour passer le résultat brut entre helpers. */
    private static class ScoreBlob {
        final double score, skillsScore, seniorityScore;
        final String category;
        final List<MatchingResult.SkillGap> gaps;
        ScoreBlob(double score, double skillsScore, double seniorityScore,
                  String category, List<MatchingResult.SkillGap> gaps) {
            this.score = score;
            this.skillsScore = skillsScore;
            this.seniorityScore = seniorityScore;
            this.category = category;
            this.gaps = gaps;
        }
    }
}
