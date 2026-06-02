package com.aziz.employeeservice.entities;

/**
 * Motif d'un changement de poste dans l'historique de carrière d'un employé.
 *
 * <ul>
 *   <li><b>HIRE</b> — Poste à l'embauche (première ligne d'historique d'un employé).</li>
 *   <li><b>PROMOTION</b> — Mobilité interne suite à une candidature retenue (entretien positif).</li>
 *   <li><b>MOBILITY</b> — Changement horizontal (même niveau, autre département/service).</li>
 *   <li><b>REASSIGNMENT</b> — Modification administrative décidée par le RH.</li>
 * </ul>
 */
public enum PositionHistoryReason {
    HIRE,
    PROMOTION,
    MOBILITY,
    REASSIGNMENT
}
