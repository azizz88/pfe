package com.aziz.recruitmentservice.entities;

/**
 * Source d'un candidat externe ajouté au pool de recrutement.
 */
public enum ExternalCandidateSource {
    /** Profil importé depuis LinkedIn (CV exporté) */
    LINKEDIN,
    /** Saisie manuelle par le RH */
    MANUAL,
    /** Autre source (cooptation, jobboard, etc.) */
    OTHER
}
