package com.aziz.recruitmentservice.dto;

import com.aziz.recruitmentservice.entities.TrainingProvider;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Résultat d'une suggestion IA pour un organisme de formation : le provider complet
 * + le score + la justification générée par le LLM.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingSuggestion {
    private Long providerId;
    private Integer score;
    private String justification;
    private TrainingProvider provider;
    /** Source du scoring : "AI" (Gemini) ou "FALLBACK" (set-overlap quand l'IA n'est pas disponible). */
    private String source;
}
