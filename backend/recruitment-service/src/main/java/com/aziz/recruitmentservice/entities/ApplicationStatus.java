package com.aziz.recruitmentservice.entities;

/**
 * Statuts du workflow de candidature.
 * Workflow : EN_ATTENTE → ENTRETIEN → RETENU / REFUSE
 */
public enum ApplicationStatus {
    EN_ATTENTE,   // Candidature soumise, en attente de traitement
    ENTRETIEN,    // Candidat convoqué pour un entretien
    RETENU,       // Candidat retenu pour le poste
    REFUSE        // Candidature refusée
}
