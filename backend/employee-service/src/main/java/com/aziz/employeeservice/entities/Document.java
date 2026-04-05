package com.aziz.employeeservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Entité représentant un document attaché à un employé (CV, certificat, etc.).
 */
@Entity
@Table(name = "documents")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nom original du fichier (ex: "cv_john.pdf") */
    @Column(nullable = false)
    private String fileName;

    /** Type MIME du fichier (ex: "application/pdf") */
    @Column(nullable = false)
    private String fileType;

    /** Chemin relatif du fichier sur le disque */
    @Column(nullable = false)
    private String filePath;

    /** Date d'upload */
    private LocalDate uploadDate;

    /** Employé propriétaire du document */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnore
    private Employee employee;

    /** Retourne l'ID de l'employé pour l'affichage JSON */
    @Transient
    public Long getEmployeeId() {
        return employee != null ? employee.getId() : null;
    }

    /** Retourne le nom complet de l'employé pour l'affichage JSON */
    @Transient
    public String getEmployeeName() {
        return employee != null ? employee.getFirstName() + " " + employee.getLastName() : null;
    }
}
