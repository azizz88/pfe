package com.aziz.employeeservice.services;

import com.aziz.employeeservice.client.SkillCatalogClient;
import com.aziz.employeeservice.dto.CvExtractionResult;
import com.aziz.employeeservice.dto.ExtractedSkill;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service d'extraction de compétences depuis un CV (MVP + V2).
 *
 *  MVP : keyword matching contre le catalogue Skill (recruitment-service).
 *  V2  : estimation du niveau via LevelEstimator (regex sur années d'expérience + mots-clés).
 *
 * Stratégie :
 *  1. Extraction texte brut (PDFBox/POI)
 *  2. Normalisation (lowercase, espaces)
 *  3. Pour chaque skill du catalogue : recherche du nom (et variantes) dans le texte
 *  4. Estimation niveau via LevelEstimator
 *  5. Tri par confidence, déduplication
 */
@Service
public class CvSkillExtractionService {

    private static final Pattern TOTAL_YEARS_PATTERN = Pattern.compile(
            "(\\d{1,2})\\s*\\+?\\s*(an(s|n[ée]es)?\\s+d['e]?\\s*exp[ée]rience|years?\\s+(of\\s+)?experience)",
            Pattern.CASE_INSENSITIVE
    );

    private final CvTextExtractor textExtractor;
    private final SkillCatalogClient skillCatalogClient;
    private final LevelEstimator levelEstimator;

    public CvSkillExtractionService(CvTextExtractor textExtractor,
                                    SkillCatalogClient skillCatalogClient,
                                    LevelEstimator levelEstimator) {
        this.textExtractor = textExtractor;
        this.skillCatalogClient = skillCatalogClient;
        this.levelEstimator = levelEstimator;
    }

    public CvExtractionResult extractFromCv(MultipartFile file, String bearerToken) throws Exception {
        String rawText = textExtractor.extract(file);
        String normalized = textExtractor.normalize(rawText);

        // Catalogue Skill depuis recruitment-service
        List<Map<String, Object>> catalog = skillCatalogClient.getAllSkills(bearerToken);

        List<ExtractedSkill> detected = new ArrayList<>();
        Set<Long> seen = new HashSet<>();

        for (Map<String, Object> skill : catalog) {
            Long id = toLong(skill.get("id"));
            String name = (String) skill.get("name");
            String category = (String) skill.get("category");
            if (id == null || name == null || seen.contains(id)) continue;

            String kw = name.toLowerCase(Locale.ROOT).trim();
            if (kw.isBlank() || kw.length() < 2) continue;

            // Vérifier que le mot-clé apparaît bien comme un "mot" (word boundary).
            // Évite "go" qui matche "django", ou "c" qui matche partout.
            if (!containsWord(normalized, kw)) continue;

            LevelEstimator.Estimation est = levelEstimator.estimate(normalized, kw);

            ExtractedSkill es = ExtractedSkill.builder()
                    .skillId(id)
                    .skillName(name)
                    .category(category)
                    .level(est.level)
                    .confidence(est.confidence)
                    .evidence(est.evidence)
                    .preselected(est.confidence >= 0.7)
                    .build();
            detected.add(es);
            seen.add(id);
        }

        // Tri : confidence DESC, puis level DESC, puis nom ASC
        detected.sort((a, b) -> {
            int c = Double.compare(b.getConfidence(), a.getConfidence());
            if (c != 0) return c;
            c = Integer.compare(b.getLevel(), a.getLevel());
            if (c != 0) return c;
            return a.getSkillName().compareToIgnoreCase(b.getSkillName());
        });

        Integer estimatedYears = extractTotalYearsOfExperience(normalized);

        return CvExtractionResult.builder()
                .skills(detected)
                .textLength(rawText != null ? rawText.length() : 0)
                .estimatedYearsOfExperience(estimatedYears)
                .fileName(file.getOriginalFilename())
                .build();
    }

    /**
     * Vérifie qu'un mot-clé apparaît comme mot autonome (entouré de séparateurs ou en début/fin).
     * Supporte les noms multi-mots (ex: "Spring Boot") en testant le pattern littéralement.
     */
    private boolean containsWord(String text, String keyword) {
        if (text == null || keyword == null) return false;
        // Échapper les regex chars + entourer de word boundaries
        String escaped = Pattern.quote(keyword);
        Pattern p = Pattern.compile("(^|\\W)" + escaped + "($|\\W)", Pattern.CASE_INSENSITIVE);
        return p.matcher(text).find();
    }

    /** Tente d'extraire le nombre total d'années d'expérience mentionné dans le CV. */
    private Integer extractTotalYearsOfExperience(String text) {
        if (text == null) return null;
        Matcher m = TOTAL_YEARS_PATTERN.matcher(text);
        int max = -1;
        while (m.find()) {
            try {
                int y = Integer.parseInt(m.group(1));
                if (y > 0 && y <= 50 && y > max) max = y;
            } catch (NumberFormatException ignored) {}
        }
        return max > 0 ? max : null;
    }

    private Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).longValue();
        try { return Long.parseLong(o.toString()); } catch (Exception e) { return null; }
    }
}
