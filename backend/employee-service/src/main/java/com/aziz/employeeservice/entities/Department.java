package com.aziz.employeeservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un département de l'entreprise.
 */
@Entity
@Table(name = "departments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nom du département (ex: Ressources Humaines, IT, Finance) */
    @Column(nullable = false, unique = true)
    private String name;

    /** Description du département */
    private String description;

    /** Liste des employés rattachés à ce département */
    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Employee> employees = new ArrayList<>();
}
