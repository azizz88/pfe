package com.aziz.recruitmentservice.entities;

/**
 * Origine du candidat évalué dans un entretien.
 */
public enum CandidateType {
    /** Candidat interne (employé de l'entreprise via mobilité) */
    INTERNAL,
    /** Candidat externe (recrutement LinkedIn ou autre source) */
    EXTERNAL
}
