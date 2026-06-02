package com.aziz.employeeservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Historique des postes occupés par un employé.
 *
 * <p>Chaque ligne représente une période d'occupation. La ligne courante a {@code endDate=null}.
 * On garde {@link Employee#getPosition()} comme champ dénormalisé "poste actuel" pour les listings,
 * mais cette table est la <b>source de vérité historique</b> et alimente la timeline de carrière.</p>
 *
 * <p>Pattern inspiré des HRIS (Workday, SuccessFactors) — permet le calcul d'ancienneté par poste,
 * les rapports de mobilité interne et l'audit des promotions.</p>
 */
@Entity
@Table(name = "position_history", indexes = {
        @Index(name = "idx_pos_hist_employee", columnList = "employee_id"),
        @Index(name = "idx_pos_hist_open", columnList = "employee_id, end_date")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PositionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Employé concerné. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnore
    private Employee employee;

    /** Intitulé du poste à cette période. */
    @Column(nullable = false)
    private String position;

    /** Département au moment du changement (dénormalisé — l'organigramme peut évoluer après). */
    @Column(name = "department_name")
    private String departmentName;

    /** Service au moment du changement (dénormalisé). */
    @Column(name = "service_name")
    private String serviceName;

    /** Début d'occupation du poste. */
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /** Fin d'occupation. {@code null} signifie poste actuel. */
    @Column(name = "end_date")
    private LocalDate endDate;

    /** Motif du changement (voir {@link PositionHistoryReason}). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PositionHistoryReason reason;

    /**
     * ID de la candidature (Application côté recruitment-service) à l'origine du changement.
     * Null pour HIRE et REASSIGNMENT. Permet de remonter au job offer / entretien validant.
     */
    @Column(name = "source_application_id")
    private Long sourceApplicationId;

    /** Nom du manager qui a validé la promotion (entretien positif). Null si non applicable. */
    @Column(name = "validated_by_manager")
    private String validatedByManagerName;

    /** Note explicative (recopiée du contexte RH si dispo). */
    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Horodatage technique de création de l'enregistrement. */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (startDate == null) startDate = LocalDate.now();
    }
}
