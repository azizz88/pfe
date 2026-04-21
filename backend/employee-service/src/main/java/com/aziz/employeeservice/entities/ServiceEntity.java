package com.aziz.employeeservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un service au sein d'un département.
 * Un département peut avoir plusieurs services (ex: Département IT -> Service Développement, Service Infrastructure).
 */
@Entity
@Table(name = "services")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ServiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nom du service (ex: Développement, Comptabilité, Recrutement) */
    @Column(nullable = false)
    private String name;

    /** Description du service */
    private String description;

    /** Département auquel ce service appartient */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    /** Liste des employés rattachés à ce service */
    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Employee> employees = new ArrayList<>();
}
