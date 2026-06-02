package com.aziz.recruitmentservice.entities;

/**
 * Statut de conventionnement d'un organisme de formation avec l'entreprise.
 *
 * CONVENTIONNE : partenaire référencé, tarifs négociés, circuit achat simplifié.
 * REFERENCE    : déjà utilisé par l'entreprise sans convention formelle.
 * NOUVEAU      : organisme jamais utilisé, validation finance requise au-delà d'un seuil.
 */
public enum ConventionStatus {
    CONVENTIONNE,
    REFERENCE,
    NOUVEAU
}
