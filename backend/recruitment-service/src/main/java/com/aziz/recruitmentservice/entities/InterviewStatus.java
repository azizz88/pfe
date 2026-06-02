package com.aziz.recruitmentservice.entities;

/**
 * Statut du cycle de vie d'un entretien.
 *
 * Workflow :
 *   PENDING_SCHEDULING   → le RH a affecté un manager, en attente de planification
 *   SCHEDULED            → le manager a fixé la date/heure/lieu (convocation envoyée)
 *   COMPLETED            → entretien réalisé, résultat à renseigner
 *   CANCELLED            → entretien annulé
 *   REJECTED_BY_MANAGER  → le manager a refusé l'affectation (motif requis), RH doit réaffecter
 */
public enum InterviewStatus {
    /** Entretien affecté à un manager, en attente de planification par celui-ci. */
    PENDING_SCHEDULING,
    /** Entretien planifié, à venir. */
    SCHEDULED,
    /** Entretien réalisé (résultat à renseigner). */
    COMPLETED,
    /** Entretien annulé. */
    CANCELLED,
    /** Le manager a refusé l'affectation — le RH doit réaffecter. */
    REJECTED_BY_MANAGER
}
