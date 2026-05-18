package com.aziz.employeeservice.services;

import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Estime le niveau (1-5) d'une compétence détectée dans un CV.
 *
 * Heuristiques (V2) :
 *   - Recherche d'années d'expérience à proximité du mot-clé (±100 chars)
 *     <1 an → 2, 1-2 ans → 3, 3-4 ans → 4, ≥5 ans → 5
 *   - Mots-clés explicites (proximité ±60 chars) :
 *       "expert", "lead", "senior" → 5
 *       "avancé", "advanced", "confirmé" → 4
 *       "intermédiaire", "intermediate" → 3
 *       "notions", "basic", "junior", "débutant" → 2
 *   - Sinon : 3 (intermédiaire) par défaut
 */
@Component
public class LevelEstimator {

    // ── Patterns "X ans/years d'expérience" ──
    private static final Pattern YEARS_PATTERN = Pattern.compile(
            "(\\d{1,2})\\s*(\\+)?\\s*(an(s|n[ée]es)?|year(s)?|y)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final int CONTEXT_RADIUS_YEARS = 100;
    private static final int CONTEXT_RADIUS_KEYWORDS = 60;

    /** Mots-clés explicites mappés à un niveau. Ordre = priorité décroissante (plus haut = gagne). */
    private static final String[][] LEVEL_KEYWORDS = {
            // Niveau 5
            {"expert", "5"}, {"lead", "5"}, {"senior", "5"}, {"architect", "5"}, {"principal", "5"},
            // Niveau 4
            {"avancé", "4"}, {"avance", "4"}, {"advanced", "4"}, {"confirmé", "4"}, {"confirme", "4"},
            {"proficient", "4"},
            // Niveau 3
            {"intermédiaire", "3"}, {"intermediaire", "3"}, {"intermediate", "3"},
            // Niveau 2
            {"junior", "2"}, {"notions", "2"}, {"basic", "2"}, {"débutant", "2"}, {"debutant", "2"},
            {"beginner", "2"}, {"familier", "2"}, {"familiar", "2"}
    };

    /**
     * Estime le niveau pour une compétence donnée, en regardant le contexte autour de toutes
     * ses occurrences dans le texte normalisé (lowercase).
     */
    public Estimation estimate(String normalizedText, String skillKeyword) {
        if (normalizedText == null || skillKeyword == null || skillKeyword.isBlank()) {
            return new Estimation(3, 0.5, null);
        }
        String kw = skillKeyword.toLowerCase(Locale.ROOT);

        int bestLevel = -1;
        double bestConfidence = 0.0;
        String bestEvidence = null;

        int idx = 0;
        while ((idx = normalizedText.indexOf(kw, idx)) >= 0) {
            // ── 1. Tester les mots-clés explicites dans un radius proche ──
            int kwStart = Math.max(0, idx - CONTEXT_RADIUS_KEYWORDS);
            int kwEnd = Math.min(normalizedText.length(), idx + kw.length() + CONTEXT_RADIUS_KEYWORDS);
            String kwContext = normalizedText.substring(kwStart, kwEnd);

            for (String[] entry : LEVEL_KEYWORDS) {
                if (kwContext.contains(entry[0])) {
                    int lvl = Integer.parseInt(entry[1]);
                    if (lvl > bestLevel) {
                        bestLevel = lvl;
                        bestConfidence = 0.85;
                        bestEvidence = snippet(normalizedText, idx, kw.length());
                    }
                }
            }

            // ── 2. Tester "X ans" dans un radius plus large ──
            int yrStart = Math.max(0, idx - CONTEXT_RADIUS_YEARS);
            int yrEnd = Math.min(normalizedText.length(), idx + kw.length() + CONTEXT_RADIUS_YEARS);
            String yrContext = normalizedText.substring(yrStart, yrEnd);

            Matcher m = YEARS_PATTERN.matcher(yrContext);
            while (m.find()) {
                int years = Integer.parseInt(m.group(1));
                if (years > 30) continue; // garde-fou contre les faux positifs
                int lvl = levelFromYears(years);
                if (lvl > bestLevel) {
                    bestLevel = lvl;
                    bestConfidence = 0.75;
                    bestEvidence = snippet(normalizedText, idx, kw.length());
                }
            }

            idx += kw.length();
        }

        if (bestLevel == -1) {
            // Mot-clé trouvé mais aucun indice de niveau → défaut prudent
            String ev = findFirstOccurrence(normalizedText, kw);
            return new Estimation(3, 0.5, ev);
        }
        return new Estimation(bestLevel, bestConfidence, bestEvidence);
    }

    private int levelFromYears(int years) {
        if (years <= 0) return 2;
        if (years == 1) return 3;
        if (years == 2) return 3;
        if (years == 3) return 4;
        if (years == 4) return 4;
        return 5; // ≥ 5 ans
    }

    private String snippet(String text, int matchStart, int matchLen) {
        int s = Math.max(0, matchStart - 40);
        int e = Math.min(text.length(), matchStart + matchLen + 40);
        String snip = text.substring(s, e).replaceAll("\\s+", " ").trim();
        return (s > 0 ? "…" : "") + snip + (e < text.length() ? "…" : "");
    }

    private String findFirstOccurrence(String text, String kw) {
        int i = text.indexOf(kw);
        if (i < 0) return null;
        return snippet(text, i, kw.length());
    }

    public static class Estimation {
        public final int level;
        public final double confidence;
        public final String evidence;

        public Estimation(int level, double confidence, String evidence) {
            this.level = level;
            this.confidence = confidence;
            this.evidence = evidence;
        }
    }
}
