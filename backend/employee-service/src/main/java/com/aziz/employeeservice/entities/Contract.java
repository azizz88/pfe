package com.aziz.employeeservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Entité représentant le contrat de travail d'un employé.
 */
@Entity
@Table(name = "contracts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Type de contrat : CDI, CDD ou STAGE */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractType type;

    /** Date de début du contrat */
    @Column(nullable = false)
    private LocalDate startDate;

    /** Date de fin du contrat (null pour CDI) */
    private LocalDate endDate;

    /** Salaire mensuel brut */
    private Double salary;

    /** Employé associé à ce contrat */
    @OneToOne(mappedBy = "contract")
    @JsonIgnore
    private Employee employee;
}
