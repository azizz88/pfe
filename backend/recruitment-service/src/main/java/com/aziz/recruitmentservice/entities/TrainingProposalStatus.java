package com.aziz.recruitmentservice.entities;

/**
 * Statut du cycle de vie d'une proposition de formation.
 *
 * Workflow :
 *   PROPOSED              → le manager a proposé l'organisme, en attente de réponse de l'employé
 *   ACCEPTED_BY_EMPLOYEE  → l'employé a accepté, en attente d'inscription par le manager
 *   REFUSED_BY_EMPLOYEE   → l'employé a refusé (terminal)
 *   ENROLLED              → le manager a confirmé l'inscription auprès de l'organisme
 *   COMPLETED             → formation terminée (terminal, certificat optionnel)
 *   ABANDONED             → formation interrompue avant son terme (terminal)
 */
public enum TrainingProposalStatus {
    PROPOSED,
    ACCEPTED_BY_EMPLOYEE,
    REFUSED_BY_EMPLOYEE,
    ENROLLED,
    COMPLETED,
    ABANDONED
}
