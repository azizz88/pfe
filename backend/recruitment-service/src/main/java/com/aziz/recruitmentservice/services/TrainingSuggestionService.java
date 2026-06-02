package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.dto.TrainingSuggestion;
import com.aziz.recruitmentservice.dto.TrainingSuggestionRequest;
import com.aziz.recruitmentservice.entities.ConventionStatus;
import com.aziz.recruitmentservice.entities.Skill;
import com.aziz.recruitmentservice.entities.TrainingProvider;
import com.aziz.recruitmentservice.repositories.SkillRepository;
import com.aziz.recruitmentservice.repositories.TrainingProviderRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service de suggestion d'organismes de formation par IA (Google Gemini).
 *
 * Stratégie : envoie la liste des skills manquants + le catalogue d'organismes
 * à Gemini en réponse JSON contrainte (responseSchema), reçoit un top 3 classé
 * avec score + justification. Si la clé n'est pas configurée ou si l'appel
 * échoue, fallback vers un scoring par intersection de skills (set-overlap).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class TrainingSuggestionService {

    private final TrainingProviderRepository providerRepository;
    private final SkillRepository skillRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String geminiModel;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String geminiBaseUrl;

    /** Limite le catalogue envoyé au LLM pour rester sous une taille de prompt raisonnable. */
    private static final int CATALOG_PROMPT_LIMIT = 30;
    /** Nombre maximum de suggestions retournées. */
    private static final int TOP_N = 3;

    public List<TrainingSuggestion> suggest(TrainingSuggestionRequest req) {
        if (req.getMissingSkillIds() == null || req.getMissingSkillIds().isEmpty()) {
            throw new IllegalArgumentException("Au moins une compétence manquante doit être fournie.");
        }

        List<Skill> missingSkills = skillRepository.findAllById(req.getMissingSkillIds());
        if (missingSkills.isEmpty()) {
            throw new IllegalArgumentException("Aucune compétence valide trouvée dans le catalogue Skills.");
        }

        List<TrainingProvider> candidates = preFilterCatalog(req, missingSkills);
        if (candidates.isEmpty()) {
            log.warn("[Suggest] Catalogue vide après filtrage — aucun organisme à proposer");
            return List.of();
        }

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.warn("[Suggest] gemini.api-key non configurée — utilisation du fallback set-overlap");
            return fallbackSetOverlap(missingSkills, candidates, req);
        }

        try {
            return callGemini(missingSkills, candidates, req);
        } catch (Exception e) {
            log.error("[Suggest] Échec appel Gemini, fallback set-overlap. Raison : {}", e.getMessage());
            return fallbackSetOverlap(missingSkills, candidates, req);
        }
    }

    /**
     * Pré-filtre le catalogue par intersection de skills + contraintes (budget, mode).
     * Garde tous les organismes qui couvrent au moins UN des skills manquants.
     * Limite à CATALOG_PROMPT_LIMIT pour rester sous une taille de prompt raisonnable.
     */
    private List<TrainingProvider> preFilterCatalog(TrainingSuggestionRequest req, List<Skill> missingSkills) {
        Set<Long> missingIds = missingSkills.stream().map(Skill::getId).collect(Collectors.toSet());

        return providerRepository.findAll().stream()
                .filter(p -> p.getSkillsCovered().stream()
                        .anyMatch(s -> missingIds.contains(s.getId())))
                .filter(p -> req.getBudgetMaxEur() == null
                        || p.getAvgPriceEur() == null
                        || p.getAvgPriceEur() <= req.getBudgetMaxEur())
                .filter(p -> req.getPreferredMode() == null
                        || p.getDeliveryMode() == null
                        || p.getDeliveryMode() == req.getPreferredMode())
                .sorted(Comparator
                        .comparingInt((TrainingProvider p) -> coverageCount(p, missingIds)).reversed()
                        .thenComparing(p -> p.getConventionStatus() == ConventionStatus.CONVENTIONNE ? 0 : 1))
                .limit(CATALOG_PROMPT_LIMIT)
                .collect(Collectors.toList());
    }

    private int coverageCount(TrainingProvider p, Set<Long> missingIds) {
        return (int) p.getSkillsCovered().stream().filter(s -> missingIds.contains(s.getId())).count();
    }

    // ===================================================
    // Gemini call
    // ===================================================

    private List<TrainingSuggestion> callGemini(List<Skill> missingSkills,
                                                List<TrainingProvider> catalog,
                                                TrainingSuggestionRequest req) throws Exception {
        String prompt = buildPrompt(missingSkills, catalog, req);
        Map<String, Object> body = buildGeminiRequestBody(prompt);

        String url = geminiBaseUrl + "/" + geminiModel + ":generateContent?key=" + geminiApiKey;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        log.info("[Suggest] Appel Gemini ({} organismes envoyés, {} skills cibles)",
                catalog.size(), missingSkills.size());

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);

        String jsonText = extractJsonText(response);
        return parseGeminiSuggestions(jsonText, catalog);
    }

    private Map<String, Object> buildGeminiRequestBody(String prompt) {
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(textPart));

        Map<String, Object> responseSchema = Map.of(
                "type", "ARRAY",
                "items", Map.of(
                        "type", "OBJECT",
                        "properties", Map.of(
                                "providerId", Map.of("type", "INTEGER"),
                                "score", Map.of("type", "INTEGER"),
                                "justification", Map.of("type", "STRING")
                        ),
                        "required", List.of("providerId", "score", "justification")
                )
        );

        Map<String, Object> generationConfig = Map.of(
                "responseMimeType", "application/json",
                "responseSchema", responseSchema,
                "temperature", 0.3
        );

        return Map.of(
                "contents", List.of(content),
                "generationConfig", generationConfig
        );
    }

    @SuppressWarnings("unchecked")
    private String extractJsonText(Map<String, Object> response) {
        if (response == null) throw new IllegalStateException("Réponse Gemini vide");
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new IllegalStateException("Aucun candidate dans la réponse Gemini");
        }
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        return (String) parts.get(0).get("text");
    }

    private List<TrainingSuggestion> parseGeminiSuggestions(String json, List<TrainingProvider> catalog) throws Exception {
        JsonNode array = objectMapper.readTree(json);
        Map<Long, TrainingProvider> byId = catalog.stream()
                .collect(Collectors.toMap(TrainingProvider::getId, p -> p));

        List<TrainingSuggestion> results = new ArrayList<>();
        for (JsonNode node : array) {
            long providerId = node.path("providerId").asLong();
            TrainingProvider provider = byId.get(providerId);
            if (provider == null) {
                log.warn("[Suggest] Gemini a renvoyé un providerId inconnu ({}) — ignoré", providerId);
                continue;
            }
            results.add(TrainingSuggestion.builder()
                    .providerId(providerId)
                    .score(node.path("score").asInt())
                    .justification(node.path("justification").asText())
                    .provider(provider)
                    .source("AI")
                    .build());
            if (results.size() >= TOP_N) break;
        }
        return results;
    }

    private String buildPrompt(List<Skill> missingSkills,
                               List<TrainingProvider> catalog,
                               TrainingSuggestionRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Tu es un assistant RH expert en formation professionnelle française.\n");
        sb.append("Ta tâche : classer les meilleurs organismes de formation pour un employé/candidat ");
        sb.append("qui doit acquérir les compétences suivantes :\n");
        for (Skill s : missingSkills) {
            sb.append("- ").append(s.getName());
            if (s.getCategory() != null) sb.append(" (").append(s.getCategory()).append(")");
            sb.append("\n");
        }
        sb.append("\n");

        if (req.getBudgetMaxEur() != null) {
            sb.append("Budget maximum : ").append(req.getBudgetMaxEur()).append(" €\n");
        }
        if (req.getPreferredMode() != null) {
            sb.append("Mode préféré : ").append(req.getPreferredMode()).append("\n");
        }
        sb.append("\n");

        sb.append("Voici la liste des organismes de formation disponibles dans notre catalogue (tu DOIS ");
        sb.append("choisir uniquement dans cette liste, ne JAMAIS inventer d'organisme) :\n\n");

        for (TrainingProvider p : catalog) {
            sb.append("ID=").append(p.getId()).append(" | ").append(p.getName()).append("\n");
            sb.append("  Compétences couvertes : ");
            sb.append(p.getSkillsCovered().stream().map(Skill::getName).collect(Collectors.joining(", ")));
            sb.append("\n");
            sb.append("  Convention : ").append(p.getConventionStatus());
            if (p.isQualiopiCertified()) sb.append(" | Qualiopi ✓");
            sb.append("\n");
            sb.append("  Prix moyen : ").append(p.getAvgPriceEur() == null ? "n.c." : p.getAvgPriceEur() + " €");
            sb.append(" | Durée : ").append(p.getAvgDurationDays() == null ? "n.c." : p.getAvgDurationDays() + " j");
            sb.append(" | Mode : ").append(p.getDeliveryMode());
            if (p.getPastSuccessRate() != null) sb.append(" | Succès : ").append(p.getPastSuccessRate()).append("%");
            sb.append("\n");
            if (p.getDescription() != null) {
                sb.append("  ").append(p.getDescription().length() > 200
                        ? p.getDescription().substring(0, 200) + "..." : p.getDescription()).append("\n");
            }
            sb.append("\n");
        }

        sb.append("Classe les 3 MEILLEURS organismes pour ces compétences. Pour chacun, donne :\n");
        sb.append("- providerId : l'ID exact de la liste ci-dessus\n");
        sb.append("- score : note de 0 à 100 reflétant la pertinence globale\n");
        sb.append("- justification : 1 phrase courte en français expliquant le choix\n\n");
        sb.append("Critères de classement (par ordre d'importance) :\n");
        sb.append("1. Couverture des compétences ciblées (un organisme qui couvre 4/5 skills > un qui couvre 1/5)\n");
        sb.append("2. Statut CONVENTIONNE (boost car circuit achat simplifié et tarifs négociés)\n");
        sb.append("3. Respect du budget et du mode préféré si renseignés\n");
        sb.append("4. Certification Qualiopi et taux de succès passé\n");
        sb.append("5. Adéquation prix/durée\n\n");
        sb.append("Réponds UNIQUEMENT avec le JSON conforme au schéma demandé, rien d'autre.");
        return sb.toString();
    }

    // ===================================================
    // Fallback set-overlap (sans IA)
    // ===================================================

    private List<TrainingSuggestion> fallbackSetOverlap(List<Skill> missingSkills,
                                                       List<TrainingProvider> catalog,
                                                       TrainingSuggestionRequest req) {
        Set<Long> missingIds = missingSkills.stream().map(Skill::getId).collect(Collectors.toSet());
        int totalMissing = missingIds.size();

        return catalog.stream()
                .map(p -> {
                    int covered = coverageCount(p, missingIds);
                    int coverageScore = (int) Math.round((covered * 100.0) / totalMissing);
                    int conventionBonus = p.getConventionStatus() == ConventionStatus.CONVENTIONNE ? 10 : 0;
                    int qualiopiBonus = p.isQualiopiCertified() ? 5 : 0;
                    int finalScore = Math.min(100, coverageScore + conventionBonus + qualiopiBonus);

                    String justification = String.format(
                            "Couvre %d/%d compétences ciblées%s%s.",
                            covered, totalMissing,
                            p.getConventionStatus() == ConventionStatus.CONVENTIONNE ? ", organisme conventionné" : "",
                            p.isQualiopiCertified() ? ", certifié Qualiopi" : "");

                    return TrainingSuggestion.builder()
                            .providerId(p.getId())
                            .score(finalScore)
                            .justification(justification)
                            .provider(p)
                            .source("FALLBACK")
                            .build();
                })
                .sorted(Comparator.comparingInt(TrainingSuggestion::getScore).reversed())
                .limit(TOP_N)
                .collect(Collectors.toList());
    }
}
