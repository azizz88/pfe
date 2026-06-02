package com.aziz.employeeservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties({"employees", "services", "hibernateLazyInitializer", "handler"})
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

    /** Liste des services de ce département */
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ServiceEntity> services = new ArrayList<>();

    /**
     * Manager responsable du département (rôle Keycloak MANAGER).
     * Nullable : un département peut temporairement ne pas avoir de manager.
     * Le manager est lui-même un Employee (un manager EST un employé avec une responsabilité supplémentaire).
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manager_id")
    @JsonIgnoreProperties({"department", "service", "contract", "skills", "hibernateLazyInitializer", "handler"})
    private Employee manager;
}
