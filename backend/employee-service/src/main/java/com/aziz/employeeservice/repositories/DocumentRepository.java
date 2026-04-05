package com.aziz.employeeservice.repositories;

import com.aziz.employeeservice.entities.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour l'accès aux documents des employés.
 */
@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    /** Liste les documents d'un employé */
    List<Document> findByEmployee_Id(Long employeeId);
}
