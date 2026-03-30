package com.aziz.employeeservice.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Entité représentant un employé de l'entreprise.
 */
@Entity
@Table(name = "employees")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Matricule unique de l'employé (ex: EMP-001) */
    @Column(nullable = false, unique = true)
    private String matricule;

    /** Prénom */
    @Column(nullable = false)
    private String firstName;

    /** Nom de famille */
    @Column(nullable = false)
    private String lastName;

    /** Adresse email professionnelle */
    @Column(nullable = false, unique = true)
    private String email;

    /** Numéro de téléphone */
    private String phone;

    /** Poste occupé */
    private String position;

    /** Date d'embauche */
    private LocalDate hireDate;

    /** Département de rattachement */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    /** Contrat de travail */
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    /** Nom d'utilisateur Keycloak associé */
    private String keycloakUsername;
}
